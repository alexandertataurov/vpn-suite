"""Outline integration API: status, keys (list/create/rename/revoke), download token, config, QR. All Outline calls server-side; no secrets to browser."""

import secrets
from datetime import datetime, timezone
from io import BytesIO

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import (
    PERM_OUTLINE_READ,
    PERM_OUTLINE_WRITE,
    REDIS_KEY_OUTLINE_CONFIG_PREFIX,
)
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.logging_config import request_id_ctx
from app.core.rate_limit import rate_limit_outline_keys_mutate
from app.core.rbac import require_permission
from app.core.redis_client import get_redis
from app.models import Device
from app.schemas.outline import (
    OutlineDataLimitIn,
    OutlineHostnameIn,
    OutlineKeyCreateIn,
    OutlineKeyListOut,
    OutlineKeyOut,
    OutlineKeyRenameIn,
    OutlineMetricsOut,
    OutlinePortIn,
    OutlineServerOut,
    OutlineStatusOut,
)
from app.services.audit_service import log_audit
from app.services.outline_client import OutlineError, OutlineShadowboxClient

OUTLINE_CONFIG_TOKEN_TTL_SECONDS = 120

router = APIRouter(prefix="/outline", tags=["outline"])


def _outline_disabled() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={"code": "OUTLINE_DISABLED", "message": "Outline integration is disabled"},
    )


def _get_client() -> OutlineShadowboxClient:
    if not settings.outline_integration_enabled or not settings.outline_manager_url:
        raise _outline_disabled()
    return OutlineShadowboxClient(
        settings.outline_manager_url,
        verify_ssl=True,
        timeout=settings.outline_request_timeout_seconds,
        retry_count=settings.outline_retry_count,
    )


def _safe_key(key: dict) -> dict:
    """Strip accessUrl/password for API response."""
    return {
        "id": str(key.get("id", "")),
        "name": key.get("name"),
        "port": int(key.get("port", 0)),
        "method": key.get("method", ""),
        "dataLimit": key.get("dataLimit"),
        "bytesTransferred": None,
        "linkedDeviceId": None,
    }


@router.get("/status", response_model=OutlineStatusOut)
async def outline_status(
    _admin=Depends(require_permission(PERM_OUTLINE_READ)),
):
    """Check Outline manager connectivity. Returns status connected/degraded/offline."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    now = datetime.now(timezone.utc)
    try:
        server = await client.get_server()
        return OutlineStatusOut(
            status="connected",
            version=server.get("version"),
            name=server.get("name"),
            lastCheckedAt=now,
        )
    except OutlineError:
        return OutlineStatusOut(
            status="offline",
            version=None,
            name=None,
            lastCheckedAt=now,
        )


@router.get("/server", response_model=OutlineServerOut)
async def outline_server(
    _admin=Depends(require_permission(PERM_OUTLINE_READ)),
):
    """Full server info: name, version, port for new keys, hostname, global data limit, metrics enabled."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    try:
        server = await client.get_server()
    except OutlineError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to get server info"},
        ) from None
    return OutlineServerOut(
        name=server.get("name"),
        serverId=server.get("serverId"),
        version=server.get("version"),
        metricsEnabled=bool(server.get("metricsEnabled", False)),
        portForNewAccessKeys=server.get("portForNewAccessKeys"),
        hostnameForAccessKeys=server.get("hostnameForAccessKeys"),
        accessKeyDataLimit=server.get("accessKeyDataLimit"),
    )


@router.get("/metrics", response_model=OutlineMetricsOut)
async def outline_metrics(
    since: str | None = Query(None, description="Time range for metrics (optional)"),
    _admin=Depends(require_permission(PERM_OUTLINE_READ)),
):
    """Experimental server + per-key telemetry: tunnel time, data transferred, lastTrafficSeen, bandwidth."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    try:
        data = await client.get_server_metrics(since=since)
    except OutlineError as e:
        # 400/404/501 = metrics not supported, disabled, or experimental endpoint unavailable; return empty instead of 502
        if e.status_code in (400, 404, 501):
            return OutlineMetricsOut(server=None, accessKeys=None)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to get metrics"},
        ) from e
    return OutlineMetricsOut(
        server=data.get("server"),
        accessKeys=data.get("accessKeys"),
    )


@router.put("/server/access-key-data-limit", status_code=status.HTTP_204_NO_CONTENT)
async def outline_set_server_data_limit(
    request: Request,
    body: OutlineDataLimitIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Set global data limit for all access keys. Audit logged."""
    if body.bytes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="bytes must be positive"
        )
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.set_server_access_key_data_limit(body.bytes)
    except OutlineError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to set server limit"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.server.set_data_limit",
        resource_type="outline",
        resource_id="server",
        old_new={"bytes": body.bytes},
        request_id=rid,
    )
    await db.commit()


@router.delete("/server/access-key-data-limit", status_code=status.HTTP_204_NO_CONTENT)
async def outline_delete_server_data_limit(
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Remove global data limit. Audit logged."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.delete_server_access_key_data_limit()
    except OutlineError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to remove server limit"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.server.delete_data_limit",
        resource_type="outline",
        resource_id="server",
        old_new={},
        request_id=rid,
    )
    await db.commit()


@router.put("/server/hostname-for-access-keys", status_code=status.HTTP_204_NO_CONTENT)
async def outline_set_hostname_for_keys(
    request: Request,
    body: OutlineHostnameIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Set hostname/domain for access keys (DPI hardening). Re-issue keys to apply."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.set_hostname_for_access_keys(body.hostname.strip())
    except OutlineError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to set hostname"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.server.set_hostname",
        resource_type="outline",
        resource_id="server",
        old_new={"hostname": body.hostname.strip()},
        request_id=rid,
    )
    await db.commit()


@router.put("/server/port-for-new-access-keys", status_code=status.HTTP_204_NO_CONTENT)
async def outline_set_port_for_new_keys(
    request: Request,
    body: OutlinePortIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Set default port for newly created keys (1–65535). Audit logged."""
    if not (1 <= body.port <= 65535):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="port must be 1–65535")
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.set_port_for_new_access_keys(body.port)
    except OutlineError as e:
        if e.status_code == 409:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Port already in use"
            ) from e
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to set port"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.server.set_port",
        resource_type="outline",
        resource_id="server",
        old_new={"port": body.port},
        request_id=rid,
    )
    await db.commit()


@router.get("/keys", response_model=OutlineKeyListOut)
async def outline_list_keys(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_OUTLINE_READ)),
):
    """List Outline access keys (no accessUrl/password). Include bytesTransferred and linkedDeviceId."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    try:
        raw_keys = await client.list_access_keys()
        transfer = await client.get_transfer_metrics()
    except OutlineError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to list keys"},
        ) from e
    key_ids = [str(k.get("id", "")) for k in raw_keys]
    device_map: dict[str, str] = {}
    if key_ids:
        result = await db.execute(
            select(Device.id, Device.outline_key_id).where(Device.outline_key_id.in_(key_ids))
        )
        for row in result.all():
            device_map[str(row.outline_key_id)] = str(row.id)
    keys = []
    for k in raw_keys:
        key_id = str(k.get("id", ""))
        out = _safe_key(k)
        out["bytesTransferred"] = transfer.get(key_id)
        out["linkedDeviceId"] = device_map.get(key_id)
        keys.append(OutlineKeyOut(**out))
    return OutlineKeyListOut(keys=keys)


@router.get("/keys/config")
async def outline_config_download(
    request: Request,
    token: str = Query(..., description="One-time download token"),
):
    """Return Outline key config (ss://...) as attachment. No JWT; token is one-time. Rate-limited."""
    redis = get_redis()
    key_redis = REDIS_KEY_OUTLINE_CONFIG_PREFIX + token
    access_url = await redis.get(key_redis)
    if not access_url:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"code": "TOKEN_INVALID", "message": "Download token invalid or already used"},
        )
    await redis.delete(key_redis)
    return Response(
        content=access_url,
        media_type="text/plain",
        headers={
            "Content-Disposition": 'attachment; filename="outline.conf"',
        },
    )


@router.get("/keys/{key_id}/download-token")
async def outline_download_token(
    key_id: str,
    _admin=Depends(require_permission(PERM_OUTLINE_READ)),
):
    """Return a one-time token and download URL for the key config. Config contains secret; never returned in JSON."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    try:
        key_data = await client.get_access_key(key_id)
    except OutlineError as e:
        if e.status_code == 404:
            raise not_found_404("Outline key", key_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to get key"},
        ) from e
    access_url = key_data.get("accessUrl")
    if not access_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Key has no access URL"},
        )
    token = secrets.token_urlsafe(32)
    redis = get_redis()
    await redis.set(
        REDIS_KEY_OUTLINE_CONFIG_PREFIX + token,
        access_url,
        ex=OUTLINE_CONFIG_TOKEN_TTL_SECONDS,
    )
    return {
        "token": token,
        "downloadUrl": f"/api/v1/outline/keys/config?token={token}",
    }


@router.get("/keys/{key_id}/qr", response_class=Response)
async def outline_key_qr(
    key_id: str,
    _admin=Depends(require_permission(PERM_OUTLINE_READ)),
):
    """Return QR code image (PNG) for the key access URL. Server-side only; no accessUrl in response body."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    try:
        key_data = await client.get_access_key(key_id)
    except OutlineError as e:
        if e.status_code == 404:
            raise not_found_404("Outline key", key_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to get key"},
        ) from e
    access_url = key_data.get("accessUrl")
    if not access_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Key has no access URL"},
        )
    buf = BytesIO()
    qrcode.make(access_url).save(buf, "PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")


@router.post("/keys", response_model=OutlineKeyOut, status_code=status.HTTP_201_CREATED)
async def outline_create_key(
    request: Request,
    body: OutlineKeyCreateIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Create Outline access key. Optionally link to Device. Audit logged."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    await rate_limit_outline_keys_mutate(request, admin_id or "anonymous")
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        created = await client.create_access_key(
            name=body.name,
            limit_bytes=body.limitBytes,
        )
    except OutlineError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to create key"},
        ) from e
    key_id = str(created.get("id", ""))
    if body.linkDeviceId:
        result = await db.execute(select(Device).where(Device.id == body.linkDeviceId))
        dev = result.scalar_one_or_none()
        if dev:
            dev.outline_key_id = key_id
            await db.flush()
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.key.create",
        resource_type="outline",
        resource_id=key_id,
        old_new={"name": body.name, "linkDeviceId": body.linkDeviceId},
        request_id=rid,
    )
    await db.commit()
    return OutlineKeyOut(**_safe_key(created))


@router.patch("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def outline_rename_key(
    request: Request,
    key_id: str,
    body: OutlineKeyRenameIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Rename Outline access key. Audit logged."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.rename_access_key(key_id, body.name)
    except OutlineError as e:
        if e.status_code == 404:
            raise not_found_404("Outline key", key_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to rename key"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.key.rename",
        resource_type="outline",
        resource_id=key_id,
        old_new={"name": body.name},
        request_id=rid,
    )
    await db.commit()


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def outline_revoke_key(
    request: Request,
    key_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Revoke Outline access key. Clears device.outline_key_id if linked. Audit logged."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    await rate_limit_outline_keys_mutate(request, admin_id or "anonymous")
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    result = await db.execute(select(Device).where(Device.outline_key_id == key_id))
    for dev in result.scalars().all():
        dev.outline_key_id = None
    await db.flush()
    try:
        await client.delete_access_key(key_id)
    except OutlineError as e:
        if e.status_code == 404:
            raise not_found_404("Outline key", key_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to revoke key"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.key.revoke",
        resource_type="outline",
        resource_id=key_id,
        old_new={},
        request_id=rid,
    )
    await db.commit()


@router.put("/keys/{key_id}/data-limit", status_code=status.HTTP_204_NO_CONTENT)
async def outline_set_key_data_limit(
    request: Request,
    key_id: str,
    body: OutlineDataLimitIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Set per-key data limit. Audit logged."""
    if body.bytes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="bytes must be positive"
        )
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.set_access_key_data_limit(key_id, body.bytes)
    except OutlineError as e:
        if e.status_code == 404:
            raise not_found_404("Outline key", key_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY
            if (e.status_code or 0) >= 500
            else status.HTTP_400_BAD_REQUEST,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to set key limit"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.key.set_data_limit",
        resource_type="outline",
        resource_id=key_id,
        old_new={"bytes": body.bytes},
        request_id=rid,
    )
    await db.commit()


@router.delete("/keys/{key_id}/data-limit", status_code=status.HTTP_204_NO_CONTENT)
async def outline_delete_key_data_limit(
    request: Request,
    key_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_OUTLINE_WRITE)),
):
    """Remove per-key data limit. Audit logged."""
    try:
        client = _get_client()
    except HTTPException:
        raise
    admin_id = str(admin.id) if hasattr(admin, "id") else None
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    try:
        await client.delete_access_key_data_limit(key_id)
    except OutlineError as e:
        if e.status_code == 404:
            raise not_found_404("Outline key", key_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "OUTLINE_ERROR", "message": "Failed to remove key limit"},
        ) from e
    await log_audit(
        db,
        admin_id=admin_id,
        action="outline.key.delete_data_limit",
        resource_type="outline",
        resource_id=key_id,
        old_new={},
        request_id=rid,
    )
    await db.commit()
