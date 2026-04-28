"""Expire stale payment intents that never received provider confirmation."""

from __future__ import annotations

import asyncio
import logging

from app.core.logging_config import extra_for_event
from app.core.redaction import redact_for_log
from app.services.payment_state_service import expire_stale_payments

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 60


async def run_payment_expiry_loop() -> None:
    """Expire pending/requires_action payments on a short cadence."""
    from app.core.database import async_session_factory

    while True:
        try:
            async with async_session_factory() as session:
                expired = await expire_stale_payments(session)
                if expired:
                    await session.commit()
                    _log.info(
                        "payment_expiry_completed expired=%d",
                        expired,
                        extra=extra_for_event(
                            event="worker.payment_expiry.completed",
                            entity_id=f"expired={expired}",
                        ),
                    )
        except Exception as exc:
            _log.exception(
                "Payment expiry loop error: %s",
                redact_for_log(str(exc)),
                extra=extra_for_event(
                    event="worker.payment_expiry.failed",
                    error_code="E_INTERNAL",
                    error_kind="internal",
                ),
            )
        await asyncio.sleep(INTERVAL_SECONDS)
