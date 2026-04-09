"""Admin churn prediction: high-risk users, revenue at risk, suggested retention."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_CLUSTER_READ, PERM_RETENTION_WRITE
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import ChurnRiskScore, Plan, Subscription
from app.services.churn_prediction_service import run_churn_prediction

router = APIRouter(prefix="/admin/churn", tags=["admin-churn"])


class ChurnRiskUserOut(BaseModel):
    user_id: int
    subscription_id: str | None
    score: float
    factors: dict | None
    computed_at: str


class ChurnRiskListOut(BaseModel):
    items: list[ChurnRiskUserOut]
    total: int
    revenue_at_risk: float


class ChurnRunOut(BaseModel):
    scored: int
    high_risk: int


@router.post("/run", response_model=ChurnRunOut)
async def run_churn_prediction_endpoint(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_RETENTION_WRITE)),
):
    """Run churn prediction job; persist scores to churn_risk_scores."""
    result = await run_churn_prediction(db)
    await db.commit()
    return ChurnRunOut(**result)


@router.get("/risk-list", response_model=ChurnRiskListOut)
async def get_churn_risk_list(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
    min_score: float = Query(0.5, ge=0, le=1),
    limit: int = Query(50, ge=1, le=200),
):
    """High-risk users from churn_risk_scores; revenue at risk = sum(plan value * remaining days/30) for high-risk."""
    result = await db.execute(
        select(ChurnRiskScore)
        .where(ChurnRiskScore.score >= min_score)
        .order_by(ChurnRiskScore.computed_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    items = [
        ChurnRiskUserOut(
            user_id=r.user_id,
            subscription_id=r.subscription_id,
            score=r.score,
            factors=r.factors,
            computed_at=r.computed_at.isoformat() if r.computed_at else "",
        )
        for r in rows
    ]

    # Revenue at risk: for high-risk subs, sum (plan monthly value * remaining days / 30)
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    sub_ids = [r.subscription_id for r in rows if r.subscription_id]
    revenue_at_risk = 0.0
    if sub_ids:
        subs_plans = (
            await db.execute(
                select(Subscription.id, Subscription.valid_until, Subscription.plan_id).where(
                    Subscription.id.in_(sub_ids), Subscription.valid_until > now
                )
            )
        ).all()
        plan_ids = list({s.plan_id for s in subs_plans})
        plans = (
            await db.execute(
                select(Plan.id, Plan.price_amount, Plan.duration_days).where(Plan.id.in_(plan_ids))
            )
        ).all()
        plan_map = {p.id: (float(p.price_amount), p.duration_days or 30) for p in plans}
        for s in subs_plans:
            days_left = (s.valid_until - now).days if s.valid_until else 0
            if days_left <= 0:
                continue
            price, dur = plan_map.get(s.plan_id, (0, 30))
            monthly = price * 30.0 / dur
            revenue_at_risk += monthly * (days_left / 30.0)

    return ChurnRiskListOut(
        items=items, total=len(items), revenue_at_risk=round(revenue_at_risk, 2)
    )
