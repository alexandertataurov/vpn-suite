"""Background tasks for admin control center: abuse detection, churn prediction, retention rules."""

from __future__ import annotations

import asyncio
import logging

from app.core.database import async_session_factory
from app.services.abuse_detection_service import run_abuse_detection
from app.services.churn_prediction_service import run_churn_prediction
from app.services.retention_automation_engine import run_retention_rules

try:
    from app.core.metrics import (
        vpn_abuse_high_risk_users,
        vpn_abuse_medium_risk_users,
        vpn_abuse_signals_total,
    )
except Exception:
    vpn_abuse_high_risk_users = None
    vpn_abuse_medium_risk_users = None
    vpn_abuse_signals_total = None

_log = logging.getLogger(__name__)

ABUSE_INTERVAL_SECONDS = 900  # 15 min
CHURN_INTERVAL_SECONDS = 900  # 15 min
RETENTION_INTERVAL_SECONDS = 300  # 5 min


async def _run_abuse_loop() -> None:
    while True:
        try:
            async with async_session_factory() as session:
                result = await run_abuse_detection(session)
                await session.commit()
                if vpn_abuse_high_risk_users is not None:
                    try:
                        vpn_abuse_high_risk_users.set(result.get("high_risk", 0))
                        vpn_abuse_medium_risk_users.set(result.get("medium_risk", 0))
                        for sev, count in (result.get("signals_by_severity") or {}).items():
                            if count > 0:
                                vpn_abuse_signals_total.labels(severity=sev).inc(count)
                    except Exception:
                        pass
                _log.info("abuse_detection run: users_scored=%s signals_created=%s", result.get("users_scored"), result.get("signals_created"))
            await asyncio.sleep(ABUSE_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            _log.warning("abuse_detection run failed: %s", exc)
            await asyncio.sleep(ABUSE_INTERVAL_SECONDS)


async def _run_churn_loop() -> None:
    while True:
        try:
            async with async_session_factory() as session:
                result = await run_churn_prediction(session)
                await session.commit()
                _log.info("churn_prediction run: scored=%s high_risk=%s", result.get("scored"), result.get("high_risk"))
            await asyncio.sleep(CHURN_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            _log.warning("churn_prediction run failed: %s", exc)
            await asyncio.sleep(CHURN_INTERVAL_SECONDS)


async def _run_retention_loop() -> None:
    while True:
        try:
            async with async_session_factory() as session:
                result = await run_retention_rules(session)
                await session.commit()
                _log.info("retention_rules run: rules_evaluated=%s actions_taken=%s", result.get("rules_evaluated"), result.get("actions_taken"))
            await asyncio.sleep(RETENTION_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            _log.warning("retention_rules run failed: %s", exc)
            await asyncio.sleep(RETENTION_INTERVAL_SECONDS)


async def run_admin_control_center_loops() -> None:
    """Run abuse, churn, and retention loops. Never returns until cancelled."""
    abuse_task = asyncio.create_task(_run_abuse_loop())
    churn_task = asyncio.create_task(_run_churn_loop())
    retention_task = asyncio.create_task(_run_retention_loop())
    try:
        await asyncio.gather(abuse_task, churn_task, retention_task)
    except asyncio.CancelledError:
        abuse_task.cancel()
        churn_task.cancel()
        retention_task.cancel()
        for t in (abuse_task, churn_task, retention_task):
            try:
                await t
            except asyncio.CancelledError:
                pass
        raise
