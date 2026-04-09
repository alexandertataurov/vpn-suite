"""Admin churn surveys — view cancellation reasons and offer acceptance."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_SUBSCRIPTIONS_READ
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import ChurnSurvey

router = APIRouter(prefix="/admin/churn-surveys", tags=["admin-churn-surveys"])


class ChurnSurveyOut(BaseModel):
    id: str
    user_id: int
    subscription_id: str | None
    reason: str
    reason_group: str | None
    reason_code: str | None
    free_text: str | None
    discount_offered: bool
    offer_accepted: bool | None
    created_at: str


@router.get("/", response_model=list[ChurnSurveyOut])
async def list_churn_surveys(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_SUBSCRIPTIONS_READ)),
    user_id: int | None = Query(None, description="Filter by user_id"),
    subscription_id: str | None = Query(None, description="Filter by subscription_id"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List churn surveys (cancellation reasons and offer acceptance)."""
    q = select(ChurnSurvey).order_by(ChurnSurvey.created_at.desc()).limit(limit).offset(offset)
    if user_id is not None:
        q = q.where(ChurnSurvey.user_id == user_id)
    if subscription_id is not None:
        q = q.where(ChurnSurvey.subscription_id == subscription_id)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        ChurnSurveyOut(
            id=r.id,
            user_id=r.user_id,
            subscription_id=r.subscription_id,
            reason=r.reason,
            reason_group=r.reason_group,
            reason_code=r.reason_code,
            free_text=r.free_text,
            discount_offered=r.discount_offered,
            offer_accepted=r.offer_accepted,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in rows
    ]
