"""Background task: periodic health-check of all servers, write logs, auto-disable after N fails."""

import asyncio
import logging

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.metrics import health_check_failures_total
from app.models import Server
from app.services.server_health_service import run_health_check

_log = logging.getLogger(__name__)
INTERVAL = settings.node_health_interval_seconds


async def _run_once(get_adapter) -> None:
    adapter = get_adapter() if callable(get_adapter) else None
    if adapter is None:
        _log.warning("Health check skipped: runtime adapter is unavailable")
        return
    async with async_session_factory() as session:
        r = await session.execute(select(Server.id))
        server_ids = [row[0] for row in r.all()]
    for sid in server_ids:
        try:
            async with async_session_factory() as session:
                s = (
                    await session.execute(select(Server).where(Server.id == sid))
                ).scalar_one_or_none()
                if s:
                    await run_health_check(session, s, runtime_adapter=adapter)
                    await session.commit()
        except Exception as e:
            health_check_failures_total.labels(server_id=str(sid)).inc()
            _log.warning("Health check failed for server %s: %s", sid, type(e).__name__)


async def run_health_check_loop(get_adapter) -> None:
    """Run health checks every INTERVAL seconds. Log and swallow errors."""
    while True:
        try:
            await _run_once(get_adapter)
        except Exception as e:
            _log.exception("Health check loop error: %s", e)
        await asyncio.sleep(INTERVAL)
