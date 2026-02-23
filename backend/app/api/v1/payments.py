"""Payments API: list with filters (admin)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_PAYMENTS_READ
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Payment
from app.schemas.payment import PaymentList, PaymentOut

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=PaymentList)
async def list_payments(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PAYMENTS_READ)),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: int | None = Query(None),
    status: str | None = Query(None),
    provider: str | None = Query(None),
):
    q = select(Payment)
    count_q = select(func.count()).select_from(Payment)
    if user_id is not None:
        q = q.where(Payment.user_id == user_id)
        count_q = count_q.where(Payment.user_id == user_id)
    if status is not None:
        q = q.where(Payment.status == status)
        count_q = count_q.where(Payment.status == status)
    if provider is not None:
        q = q.where(Payment.provider == provider)
        count_q = count_q.where(Payment.provider == provider)
    total = (await db.execute(count_q)).scalar_one() or 0
    q = q.order_by(Payment.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    rows = list(result.scalars().all())
    return PaymentList(items=[PaymentOut.model_validate(r) for r in rows], total=total)
