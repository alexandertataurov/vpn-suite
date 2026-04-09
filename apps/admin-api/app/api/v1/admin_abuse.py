"""Admin abuse & risk: risk list, signals, actions (suspend, throttle, revoke, ban)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_ABUSE_READ, PERM_ABUSE_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import AbuseSignal, Device, User
from app.services.abuse_detection_service import run_abuse_detection

router = APIRouter(prefix="/admin/abuse", tags=["admin-abuse"])


class AbuseSignalOut(BaseModel):
    id: str
    user_id: int
    signal_type: str
    severity: str
    payload: dict | None
    created_at: str
    resolved_at: str | None


class AbuseListOut(BaseModel):
    items: list[AbuseSignalOut]
    total: int


class AbuseRunOut(BaseModel):
    users_scored: int
    signals_created: int
    high_risk: int


@router.get("/signals", response_model=AbuseListOut)
async def list_abuse_signals(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_ABUSE_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: int | None = Query(None),
    resolved: bool | None = Query(None),
):
    """List abuse signals (risk flags). Filter by user_id, resolved."""
    q = select(AbuseSignal)
    if user_id is not None:
        q = q.where(AbuseSignal.user_id == user_id)
    if resolved is False:
        q = q.where(AbuseSignal.resolved_at.is_(None))
    elif resolved is True:
        q = q.where(AbuseSignal.resolved_at.isnot(None))
    count_stmt = select(func.count()).select_from(AbuseSignal)
    if user_id is not None:
        count_stmt = count_stmt.where(AbuseSignal.user_id == user_id)
    if resolved is False:
        count_stmt = count_stmt.where(AbuseSignal.resolved_at.is_(None))
    elif resolved is True:
        count_stmt = count_stmt.where(AbuseSignal.resolved_at.isnot(None))
    total = (await db.execute(count_stmt)).scalar() or 0
    q = q.order_by(AbuseSignal.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    rows = result.scalars().all()
    items = [
        AbuseSignalOut(
            id=r.id,
            user_id=r.user_id,
            signal_type=r.signal_type,
            severity=r.severity,
            payload=r.payload,
            created_at=r.created_at.isoformat() if r.created_at else "",
            resolved_at=r.resolved_at.isoformat() if r.resolved_at else None,
        )
        for r in rows
    ]
    return AbuseListOut(items=items, total=total)


@router.post("/run", response_model=AbuseRunOut)
async def run_abuse_detection_endpoint(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_ABUSE_WRITE)),
):
    """Run abuse detection job; persist new signals."""
    result = await run_abuse_detection(db)
    await db.commit()
    return AbuseRunOut(**result)


class AbuseActionIn(BaseModel):
    action: str  # revoke_devices | ban_user


@router.post("/signals/{signal_id}/action")
async def abuse_signal_action(
    signal_id: str,
    body: AbuseActionIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_ABUSE_WRITE)),
):
    """Apply action for abuse signal: revoke_devices (revoke all user devices) or ban_user (set user.is_banned)."""
    sig = await db.get(AbuseSignal, signal_id)
    if not sig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signal not found")
    uid = sig.user_id
    now = datetime.now(timezone.utc)
    if body.action == "revoke_devices":
        result = await db.execute(
            update(Device)
            .where(Device.user_id == uid, Device.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        revoked = result.rowcount
        await db.commit()
        return {"ok": True, "action": "revoke_devices", "devices_revoked": revoked}
    if body.action == "ban_user":
        user = await db.get(User, uid)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.is_banned = True
        await db.commit()
        return {"ok": True, "action": "ban_user"}
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="action must be revoke_devices or ban_user",
    )


@router.post("/signals/{signal_id}/resolve")
async def resolve_abuse_signal(
    signal_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_ABUSE_WRITE)),
):
    """Mark signal as resolved."""
    sig = await db.get(AbuseSignal, signal_id)
    if not sig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signal not found")
    sig.resolved_at = datetime.now(timezone.utc)
    sig.resolved_by = getattr(request.state, "audit_admin_id", None)
    await db.commit()
    return {"ok": True}
