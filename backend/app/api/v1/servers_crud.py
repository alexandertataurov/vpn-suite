"""Server and server-IP CRUD sub-router (mounted under /servers)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.server_cache import invalidate_servers_list_cache
from app.api.v1.server_utils import _display_is_active
from app.core.constants import PERM_SERVERS_READ, PERM_SERVERS_WRITE
from app.core.database import get_db
from app.core.error_responses import not_found_404
from app.core.rbac import require_permission
from sqlalchemy import func

from app.models import Device, Server, ServerIp
from app.schemas.server import (
    ServerCertStatusOut,
    ServerOut,
    ServerUpdate,
    normalize_server_status,
)
from app.schemas.server_ip import (
    ServerIpCreate,
    ServerIpListOut,
    ServerIpOut,
    ServerIpUpdate,
)
from app.services.server_health_service import get_last_health

servers_crud_router = APIRouter()


@servers_crud_router.get("/{server_id}", response_model=ServerOut)
async def get_server(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    last_health = await get_last_health(db, server_id)
    last_ts = last_health.ts if last_health else None
    d = {
        "id": server.id,
        "name": server.name,
        "region": server.region,
        "api_endpoint": server.api_endpoint,
        "vpn_endpoint": server.vpn_endpoint,
        "public_key": server.public_key,
        "status": normalize_server_status(server.status),
        "is_active": _display_is_active(server, last_ts),
        "health_score": getattr(server, "health_score", None),
        "is_draining": getattr(server, "is_draining", False),
        "max_connections": getattr(server, "max_connections", None),
        "created_at": server.created_at,
        "last_seen_at": last_ts,
        "last_snapshot_at": getattr(server, "last_snapshot_at", None),
        "updated_at": getattr(server, "updated_at", None),
        "provider": getattr(server, "provider", None),
        "tags": getattr(server, "tags", None),
        "auto_sync_enabled": getattr(server, "auto_sync_enabled", False),
        "auto_sync_interval_sec": getattr(server, "auto_sync_interval_sec", 60),
        "ops_notes": getattr(server, "ops_notes", None),
        "ops_notes_updated_at": getattr(server, "ops_notes_updated_at", None),
        "ops_notes_updated_by": getattr(server, "ops_notes_updated_by", None),
        "cert_fingerprint": getattr(server, "cert_fingerprint", None),
        "cert_expires_at": getattr(server, "cert_expires_at", None),
    }
    return ServerOut(**d)


@servers_crud_router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server(
    request: Request,
    server_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Remove a server from inventory. Fails with 409 if devices reference it."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    count_result = await db.execute(
        select(func.count(Device.id)).where(Device.server_id == server_id)
    )
    device_count = count_result.scalar() or 0
    if device_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete server: {device_count} device(s) reference it. Move or revoke devices first.",
        )
    request.state.audit_resource_type = "server"
    request.state.audit_resource_id = server_id
    request.state.audit_old_new = {"deleted": {"id": server_id, "name": server.name}}
    await db.delete(server)
    await db.commit()
    await invalidate_servers_list_cache()
    return None


@servers_crud_router.patch("/{server_id}", response_model=ServerOut)
async def update_server(
    request: Request,
    server_id: str,
    body: ServerUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    data = body.model_dump(exclude_unset=True)
    if data.get("auto_sync_enabled") is False and server.is_active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Auto-sync cannot be disabled for active servers",
        )
    if "ops_notes" in data:
        data["ops_notes_updated_at"] = datetime.now(timezone.utc)
        data["ops_notes_updated_by"] = str(admin.id) if hasattr(admin, "id") else None
    old_snapshot = {
        "name": server.name,
        "region": server.region,
        "api_endpoint": server.api_endpoint,
        "is_active": server.is_active,
        "ops_notes": getattr(server, "ops_notes", None),
    }
    for k, v in data.items():
        setattr(server, k, v)
    await db.flush()
    request.state.audit_resource_type = "server"
    request.state.audit_resource_id = server.id
    request.state.audit_old_new = {"old": old_snapshot, "new": {**old_snapshot, **data}}
    await db.commit()
    await db.refresh(server)
    await invalidate_servers_list_cache()
    last_health = await get_last_health(db, server_id)
    return ServerOut(
        id=server.id,
        name=server.name,
        region=server.region,
        api_endpoint=server.api_endpoint,
        vpn_endpoint=server.vpn_endpoint,
        public_key=server.public_key,
        status=normalize_server_status(server.status),
        is_active=server.is_active,
        health_score=getattr(server, "health_score", None),
        is_draining=getattr(server, "is_draining", False),
        max_connections=getattr(server, "max_connections", None),
        created_at=server.created_at,
        last_seen_at=last_health.ts if last_health else None,
        last_snapshot_at=getattr(server, "last_snapshot_at", None),
        updated_at=getattr(server, "updated_at", None),
        provider=getattr(server, "provider", None),
        tags=getattr(server, "tags", None),
        auto_sync_enabled=getattr(server, "auto_sync_enabled", False),
        auto_sync_interval_sec=getattr(server, "auto_sync_interval_sec", 60),
        ops_notes=getattr(server, "ops_notes", None),
        ops_notes_updated_at=getattr(server, "ops_notes_updated_at", None),
        ops_notes_updated_by=getattr(server, "ops_notes_updated_by", None),
        cert_fingerprint=getattr(server, "cert_fingerprint", None),
        cert_expires_at=getattr(server, "cert_expires_at", None),
    )


@servers_crud_router.get("/{server_id}/cert-status", response_model=ServerCertStatusOut)
async def get_server_cert_status(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """Return mTLS cert status for the server (from DB: fingerprint, expires_at)."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise not_found_404("Server", server_id)
    return ServerCertStatusOut(
        fingerprint=getattr(server, "cert_fingerprint", None),
        expires_at=getattr(server, "cert_expires_at", None),
        last_rotation_at=None,
    )


@servers_crud_router.get("/{server_id}/ips", response_model=ServerIpListOut)
async def list_server_ips(
    server_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SERVERS_READ)),
):
    """List IP addresses for a server."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    if not result.scalar_one_or_none():
        raise not_found_404("Server", server_id)
    rows = (
        (
            await db.execute(
                select(ServerIp)
                .where(ServerIp.server_id == server_id)
                .order_by(ServerIp.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    total = len(rows)
    return ServerIpListOut(items=[ServerIpOut.model_validate(r) for r in rows], total=total)


@servers_crud_router.post(
    "/{server_id}/ips", response_model=ServerIpOut, status_code=status.HTTP_201_CREATED
)
async def create_server_ip(
    request: Request,
    server_id: str,
    body: ServerIpCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Add an IP address to a server."""
    result = await db.execute(select(Server).where(Server.id == server_id))
    if not result.scalar_one_or_none():
        raise not_found_404("Server", server_id)
    server_ip = ServerIp(
        server_id=server_id,
        ip=body.ip.strip(),
        role=body.role,
        state=body.state,
    )
    db.add(server_ip)
    await db.flush()
    request.state.audit_resource_type = "server_ip"
    request.state.audit_resource_id = server_ip.id
    request.state.audit_old_new = {"created": {"server_id": server_id, "ip": server_ip.ip}}
    await db.commit()
    await db.refresh(server_ip)
    return ServerIpOut.model_validate(server_ip)


@servers_crud_router.patch("/{server_id}/ips/{ip_id}", response_model=ServerIpOut)
async def update_server_ip(
    request: Request,
    server_id: str,
    ip_id: str,
    body: ServerIpUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Update role or state of a server IP."""
    result = await db.execute(
        select(ServerIp).where(ServerIp.id == ip_id, ServerIp.server_id == server_id)
    )
    server_ip = result.scalar_one_or_none()
    if not server_ip:
        raise not_found_404("IP", ip_id)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(server_ip, k, v)
    request.state.audit_resource_type = "server_ip"
    request.state.audit_resource_id = server_ip.id
    request.state.audit_old_new = {"updated": data}
    await db.commit()
    await db.refresh(server_ip)
    return ServerIpOut.model_validate(server_ip)


@servers_crud_router.delete("/{server_id}/ips/{ip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server_ip(
    request: Request,
    server_id: str,
    ip_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_permission(PERM_SERVERS_WRITE)),
):
    """Remove an IP address from a server."""
    result = await db.execute(
        select(ServerIp).where(ServerIp.id == ip_id, ServerIp.server_id == server_id)
    )
    server_ip = result.scalar_one_or_none()
    if not server_ip:
        raise not_found_404("IP", ip_id)
    request.state.audit_resource_type = "server_ip"
    request.state.audit_resource_id = server_ip.id
    request.state.audit_old_new = {"deleted": {"ip": server_ip.ip}}
    await db.delete(server_ip)
    await db.commit()
    return None
