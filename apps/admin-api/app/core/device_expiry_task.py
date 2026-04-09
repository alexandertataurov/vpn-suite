"""Background task: revoke devices whose expires_at has passed."""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import extra_for_event
from app.core.redaction import redact_for_log
from app.models import Device

_log = logging.getLogger(__name__)

INTERVAL_SECONDS = 60


async def run_device_expiry_check(session: AsyncSession) -> int:
    """Revoke devices with expires_at < now. Return count revoked."""
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(Device).where(
            Device.expires_at.isnot(None),
            Device.expires_at <= now,
            Device.revoked_at.is_(None),
        )
    )
    devices = result.scalars().all()
    for d in devices:
        d.revoked_at = now
    if devices:
        await session.flush()
        _log.info(
            "Device expiry: revoked %d device(s)",
            len(devices),
            extra=extra_for_event(
                event="worker.device_expiry.completed", entity_id=str(len(devices))
            ),
        )
    return len(devices)


async def run_device_expiry_loop() -> None:
    """Run expiry check every INTERVAL_SECONDS."""
    from app.core.database import async_session_factory

    while True:
        try:
            async with async_session_factory() as session:
                n = await run_device_expiry_check(session)
                if n:
                    await session.commit()
        except Exception as e:
            _log.exception(
                "Device expiry loop error: %s",
                redact_for_log(str(e)),
                extra=extra_for_event(
                    event="worker.loop.failed",
                    error_code="E_INTERNAL",
                    error_kind="internal",
                    error_severity="error",
                    error_retryable=True,
                ),
            )
        await asyncio.sleep(INTERVAL_SECONDS)
