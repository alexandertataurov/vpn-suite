"""Admin entitlement events ledger — inspect subscription/access audit trail."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_SUBSCRIPTIONS_READ
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import EntitlementEvent

router = APIRouter(prefix="/admin/entitlement-events", tags=["admin-entitlement-events"])


class EntitlementEventOut(BaseModel):
    id: str
    subscription_id: str | None
    user_id: int
    event_type: str
    payload: dict | None
    created_at: str


@router.get("/", response_model=list[EntitlementEventOut])
async def list_entitlement_events(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SUBSCRIPTIONS_READ)),
    user_id: int | None = Query(None, description="Filter by user_id"),
    subscription_id: str | None = Query(None, description="Filter by subscription_id"),
    event_type: str | None = Query(None, description="Filter by event_type"),
    limit: int = Query(100, ge=1, le=500),
):
    """List entitlement events (subscription/access audit trail)."""
    q = select(EntitlementEvent).order_by(EntitlementEvent.created_at.desc()).limit(limit)
    if user_id is not None:
        q = q.where(EntitlementEvent.user_id == user_id)
    if subscription_id is not None:
        q = q.where(EntitlementEvent.subscription_id == subscription_id)
    if event_type is not None:
        q = q.where(EntitlementEvent.event_type == event_type)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        EntitlementEventOut(
            id=r.id,
            subscription_id=r.subscription_id,
            user_id=r.user_id,
            event_type=r.event_type,
            payload=r.payload,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in rows
    ]
