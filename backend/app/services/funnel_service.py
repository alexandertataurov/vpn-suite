"""Funnel events for analytics: start, payment, issue, renewal."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FunnelEvent

try:
    from app.core.metrics import funnel_events_total
except Exception:
    funnel_events_total = None  # type: ignore[assignment]


async def log_funnel_event(
    session: AsyncSession,
    *,
    event_type: str,
    user_id: int | None = None,
    payload: dict | None = None,
) -> None:
    """Append one funnel event. Fire-and-forget; callers commit."""
    event = FunnelEvent(
        user_id=user_id,
        event_type=event_type,
        payload=payload or {},
    )
    session.add(event)
    if funnel_events_total is not None:
        funnel_events_total.labels(event_type=event_type).inc()
