"""Grace-on-expiry: when subscription valid_until passes, set grace; when grace_until passes, set blocked.

Spec §6.1: On expiration, system may set subscription_status=expired, access_status=grace, grace_until.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging_config import extra_for_event
from app.core.redaction import redact_for_log
from app.models import Subscription
from app.services.entitlement_service import emit_entitlement_event

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 3600  # every 1h


async def run_grace_on_expiry_check(session: AsyncSession) -> tuple[int, int]:
    """Apply grace on expired subs; block when grace_until passed. Returns (grace_applied, blocked)."""
    now = datetime.now(timezone.utc)
    grace_hours = max(0, getattr(settings, "grace_window_hours", 24))
    grace_applied, blocked = 0, 0

    # 1) Subscriptions that just expired: set expired + grace (if grace_window_hours > 0)
    if grace_hours > 0:
        result = await session.execute(
            select(Subscription).where(
                Subscription.valid_until < now,
                Subscription.subscription_status.in_(["active", "pending"]),
                Subscription.access_status != "grace",
            )
        )
        for sub in result.scalars().all():
            sub.subscription_status = "expired"
            sub.status = "expired"
            sub.access_status = "grace"
            sub.grace_until = now + timedelta(hours=grace_hours)
            sub.grace_reason = "period_end"
            await session.flush()
            await emit_entitlement_event(
                session,
                subscription_id=sub.id,
                user_id=sub.user_id,
                event_type="grace_started",
                payload={"grace_until": sub.grace_until.isoformat(), "reason": "period_end"},
            )
            grace_applied += 1

    # 2) Grace period elapsed: set access_status=blocked and emit
    result2 = await session.execute(
        select(Subscription).where(
            Subscription.access_status == "grace",
            Subscription.grace_until < now,
        )
    )
    for sub in result2.scalars().all():
        sub.access_status = "blocked"
        sub.grace_reason = None
        await session.flush()
        await emit_entitlement_event(
            session,
            subscription_id=sub.id,
            user_id=sub.user_id,
            event_type="access_blocked",
            payload={"reason": "grace_elapsed"},
        )
        blocked += 1

    return (grace_applied, blocked)


async def run_grace_on_expiry_loop() -> None:
    """Run grace check every INTERVAL_SECONDS. Disabled when grace_window_hours=0."""
    from app.core.database import async_session_factory

    grace_hours = max(0, getattr(settings, "grace_window_hours", 24))
    while True:
        try:
            async with async_session_factory() as session:
                grace_applied, blocked = await run_grace_on_expiry_check(session)
                if grace_applied or blocked:
                    await session.commit()
                    _log.info(
                        "Grace-on-expiry: grace_applied=%d blocked=%d",
                        grace_applied,
                        blocked,
                        extra=extra_for_event(
                            event="worker.grace.completed",
                            entity_id=f"grace={grace_applied},blocked={blocked}",
                        ),
                    )
        except Exception as e:
            _log.exception(
                "Grace-on-expiry loop error: %s",
                redact_for_log(str(e)),
                extra=extra_for_event(
                    event="worker.loop.failed",
                    error_code="E_INTERNAL",
                    error_kind="internal",
                ),
            )
        await asyncio.sleep(INTERVAL_SECONDS)
