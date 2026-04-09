"""Admin pricing: price history log, plan price update with audit."""

from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_PLANS_WRITE, PERM_PRICING_READ
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Plan, PriceHistory
from app.services.pricing_history_service import log_price_change

router = APIRouter(prefix="/admin/pricing", tags=["admin-pricing"])


class PriceHistoryOut(BaseModel):
    id: str
    plan_id: str
    price_amount_old: Decimal | None
    price_amount_new: Decimal
    promo_pct_old: int | None
    promo_pct_new: int | None
    changed_by_admin_id: str | None
    reason: str | None
    revenue_impact_estimate: Decimal | None
    created_at: str


class PriceHistoryListOut(BaseModel):
    items: list[PriceHistoryOut]
    total: int


class PriceChangeIn(BaseModel):
    price_amount_new: Decimal
    promo_pct_new: int | None = None
    reason: str | None = None
    revenue_impact_estimate: Decimal | None = None


@router.get("/history", response_model=PriceHistoryListOut)
async def list_price_history(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PRICING_READ)),
    plan_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    q = select(PriceHistory)
    if plan_id:
        q = q.where(PriceHistory.plan_id == plan_id)
    from sqlalchemy import func

    count_q = select(func.count()).select_from(PriceHistory)
    if plan_id:
        count_q = count_q.where(PriceHistory.plan_id == plan_id)
    total = (await db.execute(count_q)).scalar() or 0
    q = q.order_by(PriceHistory.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    rows = result.scalars().all()
    items = [
        PriceHistoryOut(
            id=r.id,
            plan_id=r.plan_id,
            price_amount_old=r.price_amount_old,
            price_amount_new=r.price_amount_new,
            promo_pct_old=r.promo_pct_old,
            promo_pct_new=r.promo_pct_new,
            changed_by_admin_id=r.changed_by_admin_id,
            reason=r.reason,
            revenue_impact_estimate=r.revenue_impact_estimate,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in rows
    ]
    return PriceHistoryListOut(items=items, total=total)


@router.post("/plans/{plan_id}/price")
async def update_plan_price(
    plan_id: str,
    body: PriceChangeIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PLANS_WRITE)),
):
    """Update plan price and log to price_history. Audit via request.state.audit_admin_id."""
    request.state.audit_resource_type = "plan_price"
    request.state.audit_resource_id = plan_id
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    old_price = plan.price_amount
    admin_id = getattr(request.state, "audit_admin_id", None)
    record = await log_price_change(
        db,
        plan_id=plan_id,
        price_amount_old=old_price,
        price_amount_new=body.price_amount_new,
        promo_pct_new=body.promo_pct_new,
        changed_by_admin_id=admin_id,
        reason=body.reason,
        revenue_impact_estimate=body.revenue_impact_estimate,
    )
    plan.price_amount = body.price_amount_new
    await db.commit()
    return {"ok": True, "history_id": record.id}
