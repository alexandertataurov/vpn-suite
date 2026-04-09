"""Periodic fallback Docker alert evaluation loop."""

from __future__ import annotations

import asyncio
import logging

from app.core.config import settings
from app.core.database import async_session_factory
from app.services.docker_alert_rule_engine import DockerAlertRuleEngine

_log = logging.getLogger(__name__)


async def run_docker_alert_poll_loop(get_telemetry_service) -> None:
    interval = max(0, int(settings.docker_alert_eval_interval_seconds))
    if interval <= 0:
        _log.info("Docker alert poll loop disabled (interval=%s)", interval)
        return
    # Production safety: don't run docker alerting unless docker telemetry hosts are explicitly configured.
    if settings.environment.lower() == "production" and not settings.docker_telemetry_hosts_json:
        _log.info("Docker alert poll loop disabled (no DOCKER_TELEMETRY_HOSTS_JSON in production)")
        return

    while True:
        try:
            telemetry = get_telemetry_service() if callable(get_telemetry_service) else None
            if telemetry is None:
                await asyncio.sleep(interval)
                continue
            engine = DockerAlertRuleEngine(telemetry)
            async with async_session_factory() as session:
                await engine.evaluate_once(session)
                await session.commit()
        except Exception as exc:
            _log.warning("Docker alert loop failed: %s", type(exc).__name__)
        await asyncio.sleep(interval)
