"""Admin payment monitoring: success/fail/pending counts, webhook errors, provider health."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PERM_PAYMENTS_READ
from app.core.database import get_db
from app.core.rbac import require_permission
from app.models import Payment, PaymentEvent

router = APIRouter(prefix="/admin/payments", tags=["admin-payments-monitor"])


class PaymentMonitorOut(BaseModel):
    success_24h: int
    failed_24h: int
    pending_count: int
    webhook_errors_24h: int
    refund_rate_30d: float


@router.get("/monitor", response_model=PaymentMonitorOut)
async def get_payments_monitor(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PAYMENTS_READ)),
):
    """Aggregate payment status counts and webhook error count for dashboard."""
    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)
    since_30d = now - timedelta(days=30)

    success_24h = (
        await db.execute(
            select(func.count()).select_from(Payment).where(
                Payment.status == "completed",
                Payment.created_at >= since_24h,
            )
        )
    ).scalar() or 0
    failed_24h = (
        await db.execute(
            select(func.count()).select_from(Payment).where(
                Payment.status == "failed",
                Payment.created_at >= since_24h,
            )
        )
    ).scalar() or 0
    pending_count = (
        await db.execute(
            select(func.count()).select_from(Payment).where(Payment.status == "pending")
        )
    ).scalar() or 0

    # Webhook errors: payment_events with event_type containing error/fail
    webhook_errors_24h = (
        await db.execute(
            select(func.count())
            .select_from(PaymentEvent)
            .join(Payment, Payment.id == PaymentEvent.payment_id)
            .where(
                PaymentEvent.created_at >= since_24h,
                PaymentEvent.event_type.ilike("%error%") | PaymentEvent.event_type.ilike("%fail%"),
            )
        )
    ).scalar() or 0

    # Refund rate: if we had refund event type; placeholder 0
    refund_rate_30d = 0.0

    return PaymentMonitorOut(
        success_24h=success_24h,
        failed_24h=failed_24h,
        pending_count=pending_count,
        webhook_errors_24h=webhook_errors_24h,
        refund_rate_30d=refund_rate_30d,
    )


class WebhookErrorOut(BaseModel):
    id: str
    payment_id: str
    event_type: str
    payload: dict | None
    created_at: str


@router.get("/webhook-errors", response_model=list[WebhookErrorOut])
async def list_webhook_errors(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(require_permission(PERM_PAYMENTS_READ)),
    limit: int = Query(50, ge=1, le=100),
):
    """Recent payment events that look like errors (event_type contains error/fail)."""
    q = (
        select(PaymentEvent)
        .where(
            PaymentEvent.event_type.ilike("%error%") | PaymentEvent.event_type.ilike("%fail%"),
        )
        .order_by(PaymentEvent.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        WebhookErrorOut(
            id=r.id,
            payment_id=r.payment_id,
            event_type=r.event_type,
            payload=r.payload,
            created_at=r.created_at.isoformat() if getattr(r, "created_at", None) else "",
        )
        for r in rows
    ]
