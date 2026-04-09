"""Periodic job: mark users who left onboarding incomplete (for funnel analytics).

Users with onboarding_completed_at IS NULL and no activity for ABANDONMENT_THRESHOLD_HOURS
get one funnel_event onboarding_abandoned (backend source) if not already logged.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import extra_for_event
from app.core.redaction import redact_for_log
from app.models import FunnelEvent, User
from app.services.funnel_service import log_funnel_event

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 43200  # 12h
ABANDONMENT_THRESHOLD_HOURS = 24


async def run_onboarding_abandonment_check(session: AsyncSession) -> int:
    """Find users who abandoned onboarding and log one funnel_event per user (idempotent). Returns count logged."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=ABANDONMENT_THRESHOLD_HOURS)

    # Users who never completed onboarding and (last_active_at or updated_at) is old
    q = select(User).where(
        User.onboarding_completed_at.is_(None),
        or_(
            and_(User.last_active_at.is_(None), User.updated_at < cutoff),
            and_(User.last_active_at.isnot(None), User.last_active_at < cutoff),
        ),
    )
    result = await session.execute(q)
    candidates = list(result.scalars().unique().all())
    if not candidates:
        return 0

    # Already logged onboarding_abandoned for these users
    existing = await session.execute(
        select(FunnelEvent.user_id).where(
            FunnelEvent.event_type == "onboarding_abandoned",
            FunnelEvent.user_id.in_([u.id for u in candidates]),
        )
    )
    already_logged = set(existing.scalars().all())

    logged = 0
    for user in candidates:
        if user.id in already_logged:
            continue
        await log_funnel_event(
            session,
            event_type="onboarding_abandoned",
            user_id=user.id,
            payload={
                "last_step": user.onboarding_step,
                "source": "backend_job",
            },
        )
        logged += 1

    return logged


async def run_onboarding_abandonment_loop() -> None:
    """Run abandonment check every INTERVAL_SECONDS."""
    from app.core.database import async_session_factory

    while True:
        try:
            async with async_session_factory() as session:
                logged = await run_onboarding_abandonment_check(session)
                if logged > 0:
                    await session.commit()
                    _log.info(
                        "Onboarding abandonment: logged %d users",
                        logged,
                        extra=extra_for_event(
                            event="worker.onboarding_abandonment.completed",
                            entity_id=f"logged={logged}",
                        ),
                    )
        except Exception as e:
            _log.exception(
                "Onboarding abandonment loop error: %s",
                redact_for_log(str(e)),
                extra=extra_for_event(
                    event="worker.loop.failed",
                    error_code="E_INTERNAL",
                    error_kind="internal",
                ),
            )
        await asyncio.sleep(INTERVAL_SECONDS)
