"""Revenue analytics: aggregate from subscriptions, payments, funnel_events, referrals for dashboard and Prometheus."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.metrics import vpn_revenue_mrr, vpn_revenue_subscriptions_active
from app.models import ChurnSurvey, FunnelEvent, Payment, Referral, Subscription
from app.services.subscription_state import entitled_active_where


async def get_revenue_snapshot(session: AsyncSession) -> dict:
    """Compute revenue KPIs from DB. Used by analytics API and to update Prometheus gauges."""
    now = datetime.now(timezone.utc)
    # Active paid subs (status=active, valid_until > now, not trial or trial_ends_at in past)
    active_result = await session.execute(
        select(func.count()).select_from(Subscription).where(*entitled_active_where(now=now))
    )
    active_count = active_result.scalar() or 0

    # MRR: sum (price_amount * 30 / duration_days) for each active sub's plan (simplified: use payment amounts)
    # Simpler: count active * avg plan price normalized to monthly
    mrr_result = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == "completed",
            Payment.created_at >= now - timedelta(days=90),
        )
    )
    total_paid_90d = mrr_result.scalar() or Decimal("0")
    try:
        mrr_approx = float(total_paid_90d) / 3.0  # rough MRR from 90d revenue
    except (TypeError, ValueError):
        mrr_approx = 0.0

    # Churn reasons (last 30d)
    churn_result = await session.execute(
        select(ChurnSurvey.reason, func.count())
        .where(ChurnSurvey.created_at >= now - timedelta(days=30))
        .group_by(ChurnSurvey.reason)
    )
    churn_by_reason = {row[0]: row[1] for row in churn_result.all()}

    # Trial started (funnel)
    trial_started_result = await session.execute(
        select(func.count())
        .select_from(FunnelEvent)
        .where(
            FunnelEvent.event_type == "trial_started",
            FunnelEvent.created_at >= now - timedelta(days=30),
        )
    )
    trial_started_30d = trial_started_result.scalar() or 0

    # Referral: paid referrals (reward_applied_at not null)
    ref_paid_result = await session.execute(
        select(func.count())
        .select_from(Referral)
        .where(
            Referral.reward_applied_at.isnot(None),
            Referral.created_at >= now - timedelta(days=30),
        )
    )
    referral_paid_30d = ref_paid_result.scalar() or 0

    return {
        "subscriptions_active": active_count,
        "mrr": round(mrr_approx, 2),
        "churn_by_reason": churn_by_reason,
        "trial_started_30d": trial_started_30d,
        "referral_paid_30d": referral_paid_30d,
    }


def update_revenue_gauges(snapshot: dict) -> None:
    """Update Prometheus gauges from snapshot."""
    vpn_revenue_subscriptions_active.set(snapshot.get("subscriptions_active", 0))
    vpn_revenue_mrr.set(snapshot.get("mrr", 0))
