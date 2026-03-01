"""Retention automation: evaluate rules, send reminders, apply discounts."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RetentionRule, Subscription


async def get_matching_subscriptions(
    session: AsyncSession,
    condition: dict,
) -> list[Subscription]:
    """Return subscriptions matching condition_json (expiry_days_lte, lifetime_months_gte, etc.)."""
    now = datetime.now(timezone.utc)
    q = select(Subscription).where(
        Subscription.status == "active",
        Subscription.valid_until > now,
        Subscription.paused_at.is_(None),
    )
    # expiry_days_lte: valid_until - now <= days
    if "expiry_days_lte" in condition:
        days = int(condition["expiry_days_lte"])
        end = now + timedelta(days=days)
        q = q.where(Subscription.valid_until <= end)
    # lifetime_months_gte: (now - created_at) >= months
    if "lifetime_months_gte" in condition:
        months = int(condition["lifetime_months_gte"])
        since = now - timedelta(days=months * 30)
        q = q.where(Subscription.created_at <= since)
    result = await session.execute(q)
    return list(result.scalars().all())


async def run_retention_rules(session: AsyncSession) -> dict:
    """Load enabled retention rules, find matching subs, apply actions (reminder/discount). Returns run summary."""
    now = datetime.now(timezone.utc)
    rules_result = await session.execute(
        select(RetentionRule)
        .where(RetentionRule.enabled.is_(True))
        .order_by(RetentionRule.priority.desc())
    )
    rules = list(rules_result.scalars().all())
    if not rules:
        return {"rules_evaluated": 0, "actions_taken": 0}

    actions_taken = 0
    for rule in rules:
        cond = rule.condition_json or {}
        subs = await get_matching_subscriptions(session, cond)
        if rule.action_type == "reminder":
            # Reminder: set reminder_3d_sent_at or reminder_1d_sent_at if within window and not yet set
            params = rule.action_params or {}
            which = params.get("which", "3d")  # "3d" or "1d"
            for sub in subs:
                if which == "3d" and sub.reminder_3d_sent_at is None:
                    days_left = (sub.valid_until - now).days
                    if 0 < days_left <= 3:
                        sub.reminder_3d_sent_at = now
                        actions_taken += 1
                elif which == "1d" and sub.reminder_1d_sent_at is None:
                    days_left = (sub.valid_until - now).days
                    if 0 < days_left <= 1:
                        sub.reminder_1d_sent_at = now
                        actions_taken += 1
        elif rule.action_type == "discount_percent":
            # Discount: store in action_params; actual promo application would be via bot/miniapp
            # Here we only record that the rule matched; no DB change for discount unless we add a "offer_sent_at"
            actions_taken += 0  # No DB update for discount offer; could add offer_sent_at later
        await session.flush()

    return {
        "rules_evaluated": len(rules),
        "actions_taken": actions_taken,
    }
