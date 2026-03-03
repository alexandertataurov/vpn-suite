"""Devices API: list, revoke, block, reset (bot or admin for reset)."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import String, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.device_cache import (
    devices_list_cache_key,
    get_devices_list_cached,
    get_devices_summary_cached,
    invalidate_devices_list_cache,
    invalidate_devices_summary_cache,
    set_devices_list_cached,
    set_devices_summary_cached,
)
from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ, PERM_DEVICES_WRITE
from app.core.database import get_db
from app.core.exception_handling import raise_http_for_control_plane_exception
from app.core.exceptions import WireGuardCommandError
from app.core.idempotency import (
    get_cached_idempotency_response,
    store_idempotency_response,
)
from app.core.metrics import config_issue_blocked_total, discovery_not_found_total
from app.core.one_time_download import create_one_time_token
from app.core.rbac import require_permission
from app.models import Device, IssuedConfig, Server, User
from app.schemas.device import (
    BlockRequest,
    BulkRevokeOut,
    BulkRevokeRequest,
    ConfigHealthDeviceEntry,
    ConfigHealthOut,
    DeleteRequest,
    DeviceLimitUpdate,
    DeviceList,
    DeviceOut,
    DeviceSummaryOut,
    DeviceUpdate,
    ResetRequest,
    RevokeRequest,
)
from app.schemas.server import AdminRotatePeerResponse
from app.services.admin_issue_service import reissue_config_for_device
from app.services.agent_action_service import create_action
from app.services.device_telemetry_cache import (
    get_device_telemetry_bulk,
    get_telemetry_last_updated,
    get_telemetry_summary,
    merge_telemetry_into_device,
)
from app.services.node_runtime import PeerConfigLike
from app.services.server_live_key_service import ServerNotSyncedError

_log = logging.getLogger(__name__)
router = APIRouter(prefix="/devices", tags=["devices"])
REVOKE_CONFIRM = settings.revoke_confirm_token
BLOCK_CONFIRM = settings.block_confirm_token


@router.post("/bulk-revoke", response_model=BulkRevokeOut)
async def bulk_revoke_devices(
    request: Request,
    body: BulkRevokeRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Revoke multiple devices. Requires confirm_token. Returns counts and any errors."""
    if body.confirm_token != REVOKE_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation code",
        )
    revoked = 0
    skipped = 0
    errors: list[str] = []
    for device_id in body.device_ids[:100]:
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        if not device:
            errors.append(f"{device_id}: not found")
            continue
        if device.revoked_at:
            skipped += 1
            continue
        device.revoked_at = datetime.now(timezone.utc)
        revoked += 1
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = ""
    request.state.audit_old_new = {
        "bulk_revoke": {"revoked": revoked, "skipped": skipped, "requested": len(body.device_ids)}
    }
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    return BulkRevokeOut(revoked=revoked, skipped=skipped, errors=errors)


@router.get("", response_model=DeviceList)
async def list_devices(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: int | None = Query(None),
    email: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    sort: str = Query("issued_at_desc"),
    node_id: str | None = Query(None, description="Filter by server/node ID"),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """List all devices with optional filters. Admin only. Attaches telemetry from cache when available."""
    try:
        cache_key = devices_list_cache_key(
            limit, offset, user_id, email, status_filter, search, sort, node_id
        )
        cached = await get_devices_list_cached(cache_key)
        if cached is not None:
            return cached
        stmt = (
            select(Device, User.email)
            .outerjoin(User, Device.user_id == User.id)
            .options(selectinload(Device.issued_configs))
        )
        count_stmt = (
            select(func.count()).select_from(Device).outerjoin(User, Device.user_id == User.id)
        )
        if user_id is not None:
            stmt = stmt.where(Device.user_id == user_id)
            count_stmt = count_stmt.where(Device.user_id == user_id)
        if email:
            stmt = stmt.where(User.email.isnot(None), User.email.ilike(f"%{email}%"))
            count_stmt = count_stmt.where(User.email.isnot(None), User.email.ilike(f"%{email}%"))
        if status_filter == "active":
            stmt = stmt.where(Device.revoked_at.is_(None))
            count_stmt = count_stmt.where(Device.revoked_at.is_(None))
        elif status_filter == "revoked":
            stmt = stmt.where(Device.revoked_at.isnot(None))
            count_stmt = count_stmt.where(Device.revoked_at.isnot(None))
        if node_id:
            stmt = stmt.where(Device.server_id == node_id)
            count_stmt = count_stmt.where(Device.server_id == node_id)
        if search and search.strip():
            term = f"%{search.strip()}%"
            search_cond = (
                Device.id.ilike(term)
                | Device.device_name.ilike(term)
                | Device.user_id.cast(String).ilike(term)
                | User.email.ilike(term)
            )
            stmt = stmt.where(search_cond)
            count_stmt = count_stmt.where(search_cond)
        total = (await db.execute(count_stmt)).scalar() or 0
        if sort == "issued_at_asc":
            stmt = stmt.order_by(Device.issued_at.asc())
        elif sort == "user":
            stmt = stmt.order_by(Device.user_id.asc(), Device.issued_at.desc())
        elif sort == "node":
            stmt = stmt.order_by(Device.server_id.asc(), Device.issued_at.desc())
        elif sort == "status":
            stmt = stmt.order_by(Device.revoked_at.asc().nulls_first(), Device.issued_at.desc())
        else:
            stmt = stmt.order_by(Device.issued_at.desc())
        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        rows = result.unique().all()
        device_ids = [row[0].id for row in rows]
        telemetry_map = await get_device_telemetry_bulk(device_ids) if device_ids else {}
        items = []
        for row in rows:
            device = row[0]
            d_out = DeviceOut.model_validate(device).model_copy(update={"user_email": row[1]})
            telemetry = telemetry_map.get(str(device.id))
            if telemetry:
                configs = device.issued_configs or []
                device_dict = {
                    "revoked_at": device.revoked_at,
                    "allowed_ips": device.allowed_ips,
                    "has_consumed_config": any(c.consumed_at for c in configs),
                    "has_pending_config": any(not c.consumed_at for c in configs),
                }
                merged = merge_telemetry_into_device(device_dict, telemetry)
                if merged:
                    d_out = d_out.model_copy(update={"telemetry": merged})
            items.append(d_out)
        out = DeviceList(items=items, total=total)
        await set_devices_list_cached(cache_key, out)
        return out
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("GET /devices list failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load devices list",
        ) from exc


def _invalid_allowed_ips():
    return or_(
        Device.allowed_ips.is_(None),
        Device.allowed_ips == "",
        Device.allowed_ips == "0.0.0.0/0, ::/0",
    )


@router.get("/summary", response_model=DeviceSummaryOut)
async def devices_summary(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Aggregate counts for devices dashboard. Admin only. Includes telemetry counts from cache. Cached 60s."""
    cached = await get_devices_summary_cached()
    if cached is not None:
        return cached
    # Single aggregated query for Device counts (total, active, no_allowed_ips)
    agg = await db.execute(
        select(
            func.count(Device.id).label("total"),
            func.count(Device.id).filter(Device.revoked_at.is_(None)).label("active"),
            func.count(Device.id).filter(_invalid_allowed_ips()).label("no_allowed_ips"),
        ).select_from(Device)
    )
    row = agg.one()
    total = row.total or 0
    active = row.active or 0
    revoked = total - active
    no_allowed_ips = row.no_allowed_ips or 0
    unused_r = await db.execute(
        select(func.count()).select_from(IssuedConfig).where(IssuedConfig.consumed_at.is_(None))
    )
    unused_configs = unused_r.scalar() or 0
    t_summary = await get_telemetry_summary()
    telemetry_last_updated = await get_telemetry_last_updated()
    # When worker has not run yet or key expired, show "now" so Devices page shows a time instead of "—"
    if telemetry_last_updated is None:
        telemetry_last_updated = datetime.now(timezone.utc)
    out = DeviceSummaryOut(
        total=total,
        active=active,
        revoked=revoked,
        unused_configs=unused_configs,
        no_allowed_ips=no_allowed_ips,
        handshake_ok_count=t_summary.get("handshake_ok_count", 0),
        no_handshake_count=t_summary.get("no_handshake_count", 0),
        traffic_zero_count=t_summary.get("traffic_zero_count", 0),
        telemetry_last_updated=telemetry_last_updated,
    )
    await set_devices_summary_cached(out)
    return out


@router.get("/config-health", response_model=ConfigHealthOut)
async def get_config_health(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(500, ge=1, le=2000),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Advanced config health: per-device reconciliation status and devices needing attention."""
    r = await db.execute(
        select(Device, User.email)
        .outerjoin(User, Device.user_id == User.id)
        .where(Device.revoked_at.is_(None))
        .order_by(Device.issued_at.desc())
        .limit(limit)
    )
    rows = r.all()
    device_ids = [row[0].id for row in rows]
    telemetry_map = await get_device_telemetry_bulk(device_ids) if device_ids else {}
    telemetry_last = await get_telemetry_last_updated()

    by_recon: dict[str, int] = {"ok": 0, "needs_reconcile": 0, "broken": 0}
    no_telemetry = 0
    needs_attention: list[ConfigHealthDeviceEntry] = []

    for device, user_email in rows:
        status_val = "suspended" if device.suspended_at else "active"
        telemetry = telemetry_map.get(str(device.id))
        configs = []  # not loaded; use defaults
        device_dict = {
            "revoked_at": device.revoked_at,
            "allowed_ips": device.allowed_ips,
            "has_consumed_config": False,
            "has_pending_config": False,
        }
        if telemetry:
            merged = merge_telemetry_into_device(device_dict, telemetry)
            if merged:
                recon = merged.reconciliation_status
                by_recon[recon] = by_recon.get(recon, 0) + 1
                reason = merged.telemetry_reason
                if not reason and recon == "broken":
                    reason = "Invalid allowed_ips"
                if recon in ("broken", "needs_reconcile"):
                    needs_attention.append(
                        ConfigHealthDeviceEntry(
                            device_id=device.id,
                            server_id=device.server_id,
                            user_email=user_email,
                            device_name=device.device_name,
                            status=status_val,
                            reconciliation_status=recon,
                            config_state=merged.config_state,
                            reason=reason,
                            handshake_age_sec=merged.handshake_age_sec,
                            peer_present=merged.peer_present,
                            node_health=merged.node_health,
                        )
                    )
            else:
                no_telemetry += 1
        else:
            no_telemetry += 1

    return ConfigHealthOut(
        by_reconciliation=by_recon,
        no_telemetry_count=no_telemetry,
        devices_needing_attention=needs_attention[:100],
        telemetry_last_updated=telemetry_last,
    )


@router.get("/{device_id}", response_model=DeviceOut)
async def get_device(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """Get single device with config history and optional peer telemetry from cache."""
    result = await db.execute(
        select(Device, User.email)
        .outerjoin(User, Device.user_id == User.id)
        .options(selectinload(Device.issued_configs))
        .where(Device.id == device_id)
    )
    row = result.unique().one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    device, user_email = row[0], row[1]
    d_out = DeviceOut.model_validate(device).model_copy(update={"user_email": user_email})
    telemetry_map = await get_device_telemetry_bulk([device_id])
    telemetry = telemetry_map.get(str(device_id))
    if telemetry:
        configs = device.issued_configs or []
        device_dict = {
            "revoked_at": device.revoked_at,
            "allowed_ips": device.allowed_ips,
            "has_consumed_config": any(c.consumed_at for c in configs),
            "has_pending_config": any(not c.consumed_at for c in configs),
        }
        merged = merge_telemetry_into_device(device_dict, telemetry)
        if merged:
            d_out = d_out.model_copy(update={"telemetry": merged})
    return d_out


@router.post("/{device_id}/reconcile")
async def reconcile_device(
    request: Request,
    device_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Re-apply peer on the node (sync allowed_ips, ensure peer present). NODE_MODE=real: direct sync. NODE_MODE=agent: queue sync action."""
    if settings.node_mode == "agent" or settings.node_discovery == "agent":
        result = await db.execute(
            select(Device.server_id).where(Device.id == device_id, Device.revoked_at.is_(None))
        )
        row = result.scalar_one_or_none()
        if not row or not row[0]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found or revoked",
            )
        server_id = row[0]
        srv = await db.execute(select(Server).where(Server.id == server_id))
        if not srv.scalar_one_or_none():
            # Fallback: device's server_id stale (e.g. vpn-node-1 from seed); use any active Server (from heartbeat)
            fallback = await db.execute(
                select(Server.id).where(Server.is_active.is_(True)).limit(1)
            )
            alt = fallback.scalar_one_or_none()
            if alt:
                server_id = alt if isinstance(alt, str) else alt[0]
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "SERVER_NOT_FOUND",
                        "message": "No Server in DB. Ensure node-agent has sent a heartbeat.",
                    },
                )
        await create_action(db, server_id=server_id, type="sync", payload={"mode": "full"})
        await db.commit()
        return {
            "reconciled": True,
            "status": "sync_queued",
            "message": "Sync action queued for node-agent; try config download shortly.",
        }
    if settings.node_mode != "real":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reconcile requires NODE_MODE=real (or NODE_MODE=agent for sync queuing)",
        )
    result = await sync_device_peer(request, device_id, db, admin)
    return {"reconciled": True, **result}


@router.post("/{device_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    request: Request,
    device_id: str,
    body: DeleteRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Permanently delete a device and its issued configs. Warning-only flow: confirm_token optional."""
    if body.confirm_token is not None and body.confirm_token != REVOKE_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation code",
        )
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"delete": {"user_id": device.user_id}}
    await db.delete(device)
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    return status.HTTP_204_NO_CONTENT


@router.post("/{device_id}/revoke", response_model=DeviceOut)
async def revoke_device(
    request: Request,
    device_id: str,
    body: RevokeRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    if body.confirm_token != REVOKE_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation code",
        )
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if device.revoked_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Device already revoked"
        )
    device.revoked_at = datetime.now(timezone.utc)
    await db.flush()
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"revoked": {"user_id": device.user_id}}
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    await db.refresh(device)
    return DeviceOut.model_validate(device)


@router.post("/{device_id}/suspend", response_model=DeviceOut)
async def suspend_device(
    request: Request,
    device_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Soft-disable device: set suspended_at. Desired-state will exclude it so agent removes peer traffic."""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if device.revoked_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot suspend revoked device"
        )
    if device.suspended_at:
        await db.refresh(device)
        return DeviceOut.model_validate(device)
    device.suspended_at = datetime.now(timezone.utc)
    await db.flush()
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"suspend": {"user_id": device.user_id}}
    await db.commit()
    await db.refresh(device)
    return DeviceOut.model_validate(device)


@router.patch("/{device_id}", response_model=DeviceOut)
async def update_device(
    request: Request,
    device_id: str,
    body: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Update device fields (name, user, node, IP, status, limits). Partial update; only set fields are applied."""
    result = await db.execute(
        select(Device).where(Device.id == device_id).options(selectinload(Device.issued_configs))
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    data = body.model_dump(exclude_unset=True)
    if not data:
        await db.refresh(device)
        row = await db.execute(select(User.email).where(User.id == device.user_id))
        user_email = row.scalar_one_or_none()
        return DeviceOut.model_validate(device).model_copy(update={"user_email": user_email})
    if "user_id" in data and data["user_id"] is not None:
        u = await db.execute(select(User).where(User.id == data["user_id"]))
        if not u.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    if "server_id" in data and data["server_id"] is not None:
        s = await db.execute(select(Server).where(Server.id == data["server_id"]))
        if not s.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Server not found")
    for k, v in data.items():
        setattr(device, k, v)
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"update": data}
    await db.commit()
    await db.refresh(device)
    await invalidate_devices_list_cache()
    await invalidate_devices_summary_cache()
    row = await db.execute(select(User.email).where(User.id == device.user_id))
    user_email = row.scalar_one_or_none()
    d_out = DeviceOut.model_validate(device).model_copy(update={"user_email": user_email})
    telemetry_map = await get_device_telemetry_bulk([device_id])
    configs = device.issued_configs or []
    if telemetry_map.get(device_id):
        merged = merge_telemetry_into_device(
            {
                "revoked_at": device.revoked_at,
                "allowed_ips": device.allowed_ips,
                "has_consumed_config": any(c.consumed_at for c in configs),
                "has_pending_config": any(not c.consumed_at for c in configs),
            },
            telemetry_map[device_id],
        )
        if merged:
            d_out = d_out.model_copy(update={"telemetry": merged})
    return d_out


@router.patch("/{device_id}/limits", response_model=DeviceOut)
async def update_device_limits(
    request: Request,
    device_id: str,
    body: DeviceLimitUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Set data limit and/or expiry for a device. Scheduler will revoke when expires_at is reached."""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if device.revoked_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update limits for revoked device",
        )
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(device, k, v)
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"limits": data}
    await db.commit()
    await db.refresh(device)
    return DeviceOut.model_validate(device)


@router.post("/{device_id}/resume", response_model=DeviceOut)
async def resume_device(
    request: Request,
    device_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Clear suspended_at so device is included in desired-state again."""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if not device.suspended_at:
        await db.refresh(device)
        return DeviceOut.model_validate(device)
    device.suspended_at = None
    await db.flush()
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"resume": {"user_id": device.user_id}}
    await db.commit()
    await db.refresh(device)
    return DeviceOut.model_validate(device)


@router.post("/{device_id}/reset")
async def reset_device(
    request: Request,
    device_id: str,
    body: ResetRequest | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
    _principal=Depends(get_admin_or_bot),
):
    """Reset device: call node to remove peer, then revoke device in DB. Allowed for bot (X-API-Key) or admin."""
    request.state.audit_admin_id = str(_principal.id) if hasattr(_principal, "id") else "bot"
    request.state.audit_action = f"{request.method} {request.url.path}"
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if device.revoked_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Device already revoked"
        )
    force_db_only = bool(body and body.force_revoke_db_only)
    if settings.node_mode == "agent":
        force_db_only = True
    adapter = request.app.state.node_runtime_adapter
    node_accepted = True
    node_error: str | None = None
    try:
        if settings.node_mode == "real":
            await adapter.remove_peer(device.server_id, device.public_key)
    except Exception as exc:
        node_accepted = False
        node_error = type(exc).__name__
        if not force_db_only:
            request.state.audit_resource_type = "device"
            request.state.audit_resource_id = device.id
            request.state.audit_old_new = {
                "reset": {
                    "user_id": device.user_id,
                    "node_accepted": False,
                    "db_only": False,
                    "error": node_error,
                }
            }
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": "NODE_REMOVE_FAILED",
                    "message": "Node did not accept reset. Retry later or set force_revoke_db_only=true.",
                },
            )
    device.revoked_at = datetime.now(timezone.utc)
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {
        "reset": {
            "user_id": device.user_id,
            "node_accepted": node_accepted,
            "db_only": force_db_only and not node_accepted,
        }
    }
    await db.commit()
    await db.refresh(device)
    if settings.node_mode == "agent":
        return {
            "status": "accepted",
            "message": "Device revoked in DB; removal pending on node-agent",
        }
    if node_accepted:
        return {"status": "ok", "message": "Device reset (revoked)"}
    return {
        "status": "degraded",
        "message": "Device revoked in DB only; node peer removal failed",
        "node_error": node_error,
    }


@router.post("/{device_id}/sync-peer")
async def sync_device_peer(
    request: Request,
    device_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Re-apply peer on the VPN node (fix wrong allowed_ips or missing peer). NODE_MODE=real and NODE_DISCOVERY=docker only."""
    if settings.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="sync-peer is not allowed in production; only node-agent applies peers.",
        )
    if settings.node_mode != "real":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sync-peer requires NODE_MODE=real",
        )
    if settings.node_discovery == "agent":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="add_peer is not supported in NODE_DISCOVERY=agent. Use NODE_DISCOVERY=docker for single-host sync, or NODE_MODE=agent so the node-agent applies desired state.",
        )
    result = await db.execute(
        select(Device).options(selectinload(Device.server)).where(Device.id == device_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if device.revoked_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Device is revoked")
    preshared_key = getattr(device, "preshared_key", None) or (
        getattr(device.server, "preshared_key", None) if device.server else None
    )
    if not preshared_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No preshared key stored. Re-issue config for this device to fix.",
        )
    allowed_ips = device.allowed_ips or "10.8.1.2/32"
    adapter = request.app.state.node_runtime_adapter
    try:
        await adapter.remove_peer(device.server_id, device.public_key)
    except Exception:
        pass
    try:
        await adapter.add_peer(
            device.server_id,
            PeerConfigLike(
                public_key=device.public_key,
                allowed_ips=allowed_ips,
                persistent_keepalive=25,
                preshared_key=preshared_key,
            ),
        )
    except WireGuardCommandError as exc:
        msg = str(exc)
        if "not found" in msg.lower() or "node not found" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "NODE_NOT_FOUND", "message": msg[:200]},
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "NODE_ADD_FAILED", "message": msg[:200]},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "NODE_ADD_FAILED", "message": str(exc)[:200]},
        ) from exc
    await db.commit()
    return {"status": "ok", "message": "Peer re-applied on node"}


@router.post("/{device_id}/reissue", response_model=AdminRotatePeerResponse)
async def reissue_device_config(
    request: Request,
    device_id: str,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Reissue config for an existing device (rotate keys, update peer, return new download URLs)."""
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device_id
    cached = await get_cached_idempotency_response("devices.reissue", device_id, idempotency_key)
    if cached and isinstance(cached.get("body"), dict):
        return AdminRotatePeerResponse(**cached["body"])
    base_url = str(request.base_url).rstrip("/")
    base_config_url = f"{base_url}/api/v1/admin/configs"
    try:
        out = await reissue_config_for_device(
            db,
            device_id=device_id,
            issued_by_admin_id=str(admin.id) if hasattr(admin, "id") else None,
            runtime_adapter=request.app.state.node_runtime_adapter,
            base_config_url=base_config_url,
        )
    except ServerNotSyncedError as e:
        config_issue_blocked_total.labels(reason="server_not_synced").inc()
        if e.server_id and "not found" in (e.reason or "").lower():
            discovery_not_found_total.labels(server_id=e.server_id).inc()
        if e.server_id and (settings.node_discovery == "agent" or settings.node_mode == "agent"):
            try:
                await create_action(
                    db, server_id=e.server_id, type="sync", payload={"mode": "full"}
                )
                await db.commit()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SERVER_NOT_SYNCED",
                "message": "Server key not verified; run sync or fix discovery.",
                "details": {"server_id": e.server_id, "reason": e.reason},
            },
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e).replace("_", " "),
        )
    except WireGuardCommandError as e:
        raise_http_for_control_plane_exception(e)
    except Exception as exc:
        rid = getattr(request.state, "request_id", None)
        _log.exception(
            "Reissue failed device_id=%s request_id=%s: %s",
            device_id,
            rid or "-",
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reissue failed. Use request_id from this response to find the error in server logs.",
        ) from exc
    await db.commit()
    await invalidate_devices_summary_cache()
    await invalidate_devices_list_cache()
    response = AdminRotatePeerResponse(
        config_awg={
            "download_url": out.config_awg.download_url,
            "qr_payload": out.config_awg.qr_payload,
            "amnezia_vpn_key": out.config_awg.amnezia_vpn_key,
        },
        config_wg_obf={
            "download_url": out.config_wg_obf.download_url,
            "qr_payload": out.config_wg_obf.qr_payload,
            "amnezia_vpn_key": out.config_wg_obf.amnezia_vpn_key,
        },
        config_wg={
            "download_url": out.config_wg.download_url,
            "qr_payload": out.config_wg.qr_payload,
            "amnezia_vpn_key": out.config_wg.amnezia_vpn_key,
        },
        request_id=out.request_id,
    )
    await store_idempotency_response(
        "devices.reissue",
        device_id,
        idempotency_key,
        response.model_dump(),
    )
    return response


@router.get("/{device_id}/awg/download-link")
async def get_awg_download_link(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    """Create one-time download link for AmneziaWG AWG config."""
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device or device.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    # Ensure there is at least one AWG-issued config; we'll resolve latest at download time.
    cfg_result = await db.execute(
        select(IssuedConfig.id)
        .where(IssuedConfig.device_id == device_id, IssuedConfig.profile_type == "awg")
        .limit(1)
    )
    if cfg_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device has no issued AmneziaWG config",
        )

    ttl = getattr(settings, "awg_download_token_ttl_seconds", 600) or 600
    try:
        token = await create_one_time_token(db, device_id=device_id, kind="awg_conf", ttl_seconds=ttl)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    public_host = getattr(settings, "public_domain", None) or getattr(
        settings, "vpn_default_host", ""
    )
    if not public_host:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PUBLIC_DOMAIN or VPN_DEFAULT_HOST must be set for download links",
        )
    url = f"https://{public_host}/d/{token}"
    return {"url": url, "expires_in": ttl}


@router.post("/{device_id}/block")
async def block_device(
    request: Request,
    device_id: str,
    body: BlockRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_DEVICES_WRITE)),
):
    if body.confirm_token != BLOCK_CONFIRM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Block requires confirm_token in body",
        )
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    adapter = request.app.state.node_runtime_adapter
    ok = True
    try:
        # WG does not have a dedicated "block" primitive; removing peer enforces block semantics.
        if settings.node_mode == "real":
            await adapter.remove_peer(device.server_id, device.public_key)
        else:
            ok = False
    except Exception:
        ok = False
    request.state.audit_resource_type = "device"
    request.state.audit_resource_id = device.id
    request.state.audit_old_new = {"block": {"user_id": device.user_id, "node_accepted": ok}}
    if settings.node_mode == "agent":
        device.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        await invalidate_devices_summary_cache()
        await invalidate_devices_list_cache()
        return {
            "status": "accepted",
            "message": "Device revoked in DB; block pending on node-agent",
        }
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Node did not accept block"
        )
    return {"status": "accepted", "message": "Peer blocked on node"}
