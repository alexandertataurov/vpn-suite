"""Emit EntitlementEvent rows for audit trail (spec v2)."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EntitlementEvent


async def emit_entitlement_event(
    session: AsyncSession,
    *,
    subscription_id: str | None,
    user_id: int,
    event_type: str,
    payload: dict | None = None,
) -> None:
    """Add immutable EntitlementEvent row."""
    session.add(
        EntitlementEvent(
            subscription_id=subscription_id,
            user_id=user_id,
            event_type=event_type,
            payload=payload or {},
        )
    )
    await session.flush()
