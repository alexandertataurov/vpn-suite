"""Background task: periodic limits check, auto-block and audit when traffic exceeds server limit."""

import asyncio
import logging

from app.core.config import settings
from app.core.database import async_session_factory
from app.services.limits_check_service import run_limits_check

_log = logging.getLogger(__name__)


async def run_limits_check_loop(get_adapter) -> None:
    """Run limits check every interval seconds. Disabled when interval is 0."""
    interval = settings.limits_check_interval_seconds
    if interval <= 0:
        _log.info("Limits check disabled (interval=%s)", interval)
        return
    while True:
        try:
            adapter = get_adapter() if callable(get_adapter) else None
            if adapter is None:
                _log.warning("Limits check skipped: runtime adapter is unavailable")
                await asyncio.sleep(interval)
                continue
            async with async_session_factory() as session:
                await run_limits_check(session, runtime_adapter=adapter)
        except Exception as e:
            _log.exception("Limits check loop error: %s", e)
        await asyncio.sleep(interval)
