"""Churn prediction: batch-compute risk score per user/subscription, write to churn_risk_scores."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChurnRiskScore, Device, Server, Subscription


async def run_churn_prediction(session: AsyncSession) -> dict:
    """Compute churn risk score for active subscriptions; persist to churn_risk_scores. Returns summary."""
    now = datetime.now(timezone.utc)
    since_14d = now - timedelta(days=14)

    # Active subscriptions with valid_until > now
    subs = (
        await session.execute(
            select(Subscription.id, Subscription.user_id, Subscription.valid_until, Subscription.created_at)
            .where(
                Subscription.status == "active",
                Subscription.valid_until > now,
                Subscription.paused_at.is_(None),
            )
        )
    ).all()

    if not subs:
        return {"scored": 0, "high_risk": 0}

    scores_to_insert: list[ChurnRiskScore] = []
    high_risk_count = 0

    for sub in subs:
        sub_id, user_id, valid_until, created_at = sub.id, sub.user_id, sub.valid_until, sub.created_at
        days_until_expiry = (valid_until - now).days if valid_until else 0
        sub_age_days = (now - created_at).days if created_at else 0

        # Features (normalized 0-1): expiry_soon, sub_age (inverse: newer = more risk), no reminder
        expiry_soon = 1.0 - min(1.0, days_until_expiry / 30.0)  # 0 when 30+ days left
        # Placeholders: usage_drop, failed_conn, server_switches, inactive_days — no telemetry in DB
        # Use expiry + age: short remaining + long tenure = lower churn risk; short remaining + short tenure = higher
        tenure_factor = min(1.0, sub_age_days / 90.0)  # 1 after 90 days
        score = 0.6 * expiry_soon + 0.4 * (1.0 - tenure_factor)
        score = min(max(score, 0.0), 1.0)

        factors = {
            "days_until_expiry": days_until_expiry,
            "sub_age_days": sub_age_days,
            "expiry_soon": round(expiry_soon, 4),
        }

        if score >= 0.6:
            high_risk_count += 1

        scores_to_insert.append(
            ChurnRiskScore(
                user_id=user_id,
                subscription_id=sub_id,
                score=round(score, 4),
                factors=factors,
                computed_at=now,
            )
        )

    # Insert new scores (optionally truncate old per user or keep history; keep history)
    for row in scores_to_insert:
        session.add(row)
    await session.flush()

    return {"scored": len(scores_to_insert), "high_risk": high_risk_count}
