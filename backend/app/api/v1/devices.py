"""Devices API: list, revoke, block, reset (bot or admin for reset)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.bot_auth import get_admin_or_bot
from app.core.config import settings
from app.core.constants import PERM_CLUSTER_READ, PERM_DEVICES_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Device, User
from app.schemas.device import (
    BlockRequest,
    BulkRevokeOut,
    BulkRevokeRequest,
    DeviceLimitUpdate,
    DeviceList,
    DeviceOut,
    ResetRequest,
    RevokeRequest,
)

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
            detail="Bulk revoke requires confirm_token in body",
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
    return BulkRevokeOut(revoked=revoked, skipped=skipped, errors=errors)


@router.get("", response_model=DeviceList)
async def list_devices(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: int | None = Query(None),
    email: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
):
    """List all devices with optional filters. Admin only."""
    stmt = select(Device).options(selectinload(Device.issued_configs))
    count_stmt = select(func.count()).select_from(Device)
    if user_id is not None:
        stmt = stmt.where(Device.user_id == user_id)
        count_stmt = count_stmt.where(Device.user_id == user_id)
    if email:
        stmt = stmt.join(User, User.id == Device.user_id).where(User.email.ilike(f"%{email}%"))
        count_stmt = count_stmt.join(User, User.id == Device.user_id).where(
            User.email.ilike(f"%{email}%")
        )
    if status_filter == "active":
        stmt = stmt.where(Device.revoked_at.is_(None))
        count_stmt = count_stmt.where(Device.revoked_at.is_(None))
    elif status_filter == "revoked":
        stmt = stmt.where(Device.revoked_at.isnot(None))
        count_stmt = count_stmt.where(Device.revoked_at.isnot(None))
    total = (await db.execute(count_stmt)).scalar() or 0
    stmt = stmt.order_by(Device.issued_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().unique().all()
    return DeviceList(items=[DeviceOut.model_validate(r) for r in rows], total=total)


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
            detail="Revoke requires confirm_token in body",
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
        return {
            "status": "accepted",
            "message": "Device revoked in DB; block pending on node-agent",
        }
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Node did not accept block"
        )
    return {"status": "accepted", "message": "Peer blocked on node"}
