"""Admin revenue: full dashboard KPIs (MRR, ARR, revenue 1d/7d/30d, ARPU, trial conversion, expiring, churn/renewal)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChurnSurvey, Device, FunnelEvent, Payment, Plan, Referral, Subscription, User


async def get_revenue_overview(session: AsyncSession) -> dict:
    """Full revenue + subscription health + referral metrics for admin dashboard."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    since_7d = now - timedelta(days=7)
    since_30d = now - timedelta(days=30)

    # Active paid subs
    active_result = await session.execute(
        select(func.count())
        .select_from(Subscription)
        .where(
            Subscription.status == "active",
            Subscription.valid_until > now,
            Subscription.paused_at.is_(None),
        )
    )
    subscriptions_active = active_result.scalar() or 0

    # Revenue: today, 7d, 30d (completed payments)
    rev_today = (
        await session.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.status == "completed",
                Payment.created_at >= today_start,
            )
        )
    ).scalar() or Decimal("0")
    rev_7d = (
        await session.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.status == "completed",
                Payment.created_at >= since_7d,
            )
        )
    ).scalar() or Decimal("0")
    rev_30d = (
        await session.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.status == "completed",
                Payment.created_at >= since_30d,
            )
        )
    ).scalar() or Decimal("0")

    # MRR from active subs: sum(price * 30/duration_days) per active sub
    active_subs_with_plan = (
        await session.execute(
            select(Subscription.plan_id, func.count().label("cnt"))
            .where(
                Subscription.status == "active",
                Subscription.valid_until > now,
                Subscription.paused_at.is_(None),
            )
            .group_by(Subscription.plan_id)
        )
    ).all()
    mrr = 0.0
    for plan_id, cnt in active_subs_with_plan:
        plan_row = (
            await session.execute(
                select(Plan.price_amount, Plan.duration_days).where(Plan.id == plan_id)
            )
        ).one_or_none()
        if plan_row and plan_row.duration_days and plan_row.duration_days > 0:
            mrr += float(plan_row.price_amount) * (30.0 / float(plan_row.duration_days)) * int(cnt)
    arr = mrr * 12.0

    # ARPU: MRR / active subs
    arpu = round(mrr / subscriptions_active, 2) if subscriptions_active else 0.0

    # Trial started 30d
    trial_started_30d = (
        await session.execute(
            select(func.count()).select_from(FunnelEvent).where(
                FunnelEvent.event_type == "trial_started",
                FunnelEvent.created_at >= since_30d,
            )
        )
    ).scalar() or 0

    # Trial → paid: distinct users who paid in 30d after having trial
    paid_users_30d = (
        await session.execute(
            select(func.count(func.distinct(Payment.user_id))).where(
                Payment.status == "completed",
                Payment.created_at >= since_30d,
            )
        )
    ).scalar() or 0
    trial_conversion_pct = (
        round(100.0 * paid_users_30d / trial_started_30d, 2) if trial_started_30d else 0.0
    )

    # Avg subscription length (days): from subscriptions that ended (valid_until in past) or active
    sub_duration_result = (
        await session.execute(
            select(
                func.extract("epoch", func.now() - Subscription.valid_from).label("days"),
            )
            .select_from(Subscription)
            .where(Subscription.status == "active", Subscription.valid_until > now)
        )
    ).scalars().all()
    avg_sub_length_days = 0.0
    if sub_duration_result:
        days_list = [float(r.days) / 86400.0 for r in sub_duration_result if r.days is not None]
        avg_sub_length_days = round(sum(days_list) / len(days_list), 1) if days_list else 0.0

    # Subscription health: expiring in 3d, 30d, expired today
    expiring_3d_end = now + timedelta(days=3)
    expiring_30d_end = now + timedelta(days=30)
    expiring_3d = (
        await session.execute(
            select(func.count())
            .select_from(Subscription)
            .where(
                Subscription.status == "active",
                Subscription.valid_until > now,
                Subscription.valid_until <= expiring_3d_end,
                Subscription.paused_at.is_(None),
            )
        )
    ).scalar() or 0
    expiring_30d = (
        await session.execute(
            select(func.count())
            .select_from(Subscription)
            .where(
                Subscription.status == "active",
                Subscription.valid_until > now,
                Subscription.valid_until <= expiring_30d_end,
                Subscription.paused_at.is_(None),
            )
        )
    ).scalar() or 0
    expired_today = (
        await session.execute(
            select(func.count())
            .select_from(Subscription)
            .where(
                Subscription.valid_until >= today_start,
                Subscription.valid_until < now,
            )
        )
    ).scalar() or 0

    # Churn rate (30d): churn_surveys count / (active at start of 30d approx) — use churn count
    churn_count_30d = (
        await session.execute(
            select(func.count()).select_from(ChurnSurvey).where(
                ChurnSurvey.created_at >= since_30d,
            )
        )
    ).scalar() or 0
    # Renewal rate: completed payments in 30d that look like renewals (same sub) / subs that could renew
    renewal_count_30d = (
        await session.execute(
            select(func.count(func.distinct(Payment.subscription_id))).where(
                Payment.status == "completed",
                Payment.created_at >= since_30d,
            )
        )
    ).scalar() or 0
    churn_rate = (
        round(100.0 * churn_count_30d / max(subscriptions_active, 1), 2)
        if subscriptions_active else 0.0
    )
    renewal_rate = (
        round(100.0 * renewal_count_30d / subscriptions_active, 2) if subscriptions_active else 0.0
    )

    # Referral: active referrers (distinct referrer_user_id with reward_applied in 30d or pending)
    active_referrers = (
        await session.execute(
            select(func.count(func.distinct(Referral.referrer_user_id))).select_from(Referral).where(
                Referral.created_at >= since_30d,
            )
        )
    ).scalar() or 0
    referral_paid_30d = (
        await session.execute(
            select(func.count()).select_from(Referral).where(
                Referral.reward_applied_at.isnot(None),
                Referral.created_at >= since_30d,
            )
        )
    ).scalar() or 0
    total_refs_30d = (
        await session.execute(
            select(func.count()).select_from(Referral).where(Referral.created_at >= since_30d)
        )
    ).scalar() or 0
    referral_conversion_pct = (
        round(100.0 * referral_paid_30d / total_refs_30d, 2) if total_refs_30d else 0.0
    )
    # Earned bonus days: sum reward_days where reward_applied_at in 30d
    ref_bonus_result = (
        await session.execute(
            select(Referral.reward_days).where(
                Referral.reward_applied_at.isnot(None),
                Referral.reward_applied_at >= since_30d,
            )
        )
    ).scalars().all()
    earned_bonus_days = sum(r.reward_days for r in ref_bonus_result) if ref_bonus_result else 0

    # Churn by reason
    churn_by_reason_result = (
        await session.execute(
            select(ChurnSurvey.reason, func.count())
            .where(ChurnSurvey.created_at >= since_30d)
            .group_by(ChurnSurvey.reason)
        )
    ).all()
    churn_by_reason = {row[0]: row[1] for row in churn_by_reason_result}

    # Active devices per server (proxy for revenue per server)
    per_server = (
        await session.execute(
            select(Device.server_id, func.count())
            .where(Device.revoked_at.is_(None), Device.server_id.isnot(None))
            .group_by(Device.server_id)
        )
    ).all()
    revenue_per_server = {str(row[0]): row[1] for row in per_server}

    return {
        "subscriptions_active": subscriptions_active,
        "mrr": round(mrr, 2),
        "arr": round(arr, 2),
        "revenue_today": round(float(rev_today), 2),
        "revenue_7d": round(float(rev_7d), 2),
        "revenue_30d": round(float(rev_30d), 2),
        "arpu": arpu,
        "trial_started_30d": trial_started_30d,
        "trial_conversion_pct": trial_conversion_pct,
        "avg_sub_length_days": avg_sub_length_days,
        "expiring_3d": expiring_3d,
        "expiring_30d": expiring_30d,
        "expired_today": expired_today,
        "churn_rate": churn_rate,
        "renewal_rate": renewal_rate,
        "churn_by_reason": churn_by_reason,
        "active_referrers": active_referrers,
        "referral_conversion_pct": referral_conversion_pct,
        "referral_paid_30d": referral_paid_30d,
        "earned_bonus_days": earned_bonus_days,
        "revenue_per_server": revenue_per_server,
    }


async def get_revenue_daily_series(session: AsyncSession, days: int = 30) -> list[dict]:
    """Revenue by day (completed payments) for the last `days` days. Returns [{date: YYYY-MM-DD, revenue: float}]."""
    from sqlalchemy import cast, Date

    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    day_col = cast(Payment.created_at, Date)
    q = (
        select(day_col, func.coalesce(func.sum(Payment.amount), 0))
        .where(
            Payment.status == "completed",
            Payment.created_at >= since,
        )
        .group_by(day_col)
        .order_by(day_col)
    )
    result = await session.execute(q)
    rows = result.all()
    # Fill missing days with 0
    by_date = {str(row[0]): float(row[1]) for row in rows}
    out = []
    for i in range(days):
        d = (now - timedelta(days=days - 1 - i)).date()
        key = str(d)
        out.append({"date": key, "revenue": round(by_date.get(key, 0.0), 2)})
    return out
