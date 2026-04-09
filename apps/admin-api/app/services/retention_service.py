"""Retention: pause subscription, record churn reason, optional retention discount."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Subscription
from app.services.subscription_lifecycle_events import emit_access_paused, emit_access_resumed
from app.services.subscription_state import mark_paused, resume_active_access


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
        if getattr(sub, "access_status", None) != "paused":
            mark_paused(sub, now=sub.paused_at, reason=sub.pause_reason)
            await session.flush()
        return True
    mark_paused(sub, now=datetime.now(timezone.utc), reason=reason)
    await session.flush()
    await emit_access_paused(
        session, subscription_id=subscription_id, user_id=user_id, reason=reason
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
    resume_active_access(sub)
    await session.flush()
    await emit_access_resumed(session, subscription_id=subscription_id, user_id=user_id)
    return True


def retention_discount_percent() -> int:
    """Return configured retention discount (e.g. 20)."""
    return max(0, min(100, settings.retention_discount_percent))
