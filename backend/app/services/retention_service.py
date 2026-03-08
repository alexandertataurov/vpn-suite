"""Retention: pause subscription, record churn reason, optional retention discount."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Subscription
from app.services.entitlement_service import emit_entitlement_event


async def pause_subscription(
    session: AsyncSession,
    *,
    subscription_id: str,
    user_id: int,
    reason: str = "user_request",
) -> bool:
    """Set subscription paused_at; subscription remains but no traffic allowed until resumed."""
    result = await session.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return False
    if sub.paused_at is not None:
        return True
    sub.paused_at = datetime.now(timezone.utc)
    sub.pause_reason = reason[:64] if reason else None
    await session.flush()
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="access_paused",
        payload={"reason": reason},
    )
    return True


async def resume_subscription(
    session: AsyncSession,
    *,
    subscription_id: str,
    user_id: int,
) -> bool:
    """Clear paused_at so subscription is active again (if valid_until still in future)."""
    result = await session.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return False
    sub.paused_at = None
    sub.pause_reason = None
    await session.flush()
    await emit_entitlement_event(
        session,
        subscription_id=subscription_id,
        user_id=user_id,
        event_type="access_resumed",
        payload={},
    )
    return True


def retention_discount_percent() -> int:
    """Return configured retention discount (e.g. 20)."""
    return max(0, min(100, settings.retention_discount_percent))
