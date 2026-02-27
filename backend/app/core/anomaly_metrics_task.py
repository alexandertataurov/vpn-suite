"""Periodic task: run anomaly_metrics and export high_risk/score_max to Prometheus."""

from __future__ import annotations

import asyncio
import logging
from typing import Callable, Awaitable, Any

from app.core.database import async_session_factory
from app.services.control_plane_service import anomaly_metrics
from app.services.topology_engine import TopologyEngine

try:
    from app.core.metrics import vpn_anomaly_high_risk_users, vpn_anomaly_score_max
except Exception:
    vpn_anomaly_high_risk_users = None
    vpn_anomaly_score_max = None

_log = logging.getLogger(__name__)

ANOMALY_METRICS_INTERVAL_SECONDS = 900  # 15 min


async def run_anomaly_metrics_export_loop(
    adapter_factory: Callable[[], Awaitable[Any]],
) -> None:
    """Run anomaly_metrics every interval and update Prometheus gauges. Requires adapter (worker only)."""
    if vpn_anomaly_high_risk_users is None:
        _log.info("Anomaly metrics export disabled (metrics not loaded)")
        return
    _log.info(
        "Anomaly metrics export task starting (interval=%ss)",
        ANOMALY_METRICS_INTERVAL_SECONDS,
    )
    while True:
        try:
            adapter = await adapter_factory()
            async with async_session_factory() as session:
                engine = TopologyEngine(adapter)
                topo = await engine.rebuild_topology()
                out = await anomaly_metrics(session, topo, adapter)
                await session.commit()
                try:
                    vpn_anomaly_high_risk_users.set(out.high_risk_users)
                    max_score = max((u.score for u in out.top_users), default=0.0)
                    vpn_anomaly_score_max.set(max_score)
                except Exception:
                    pass
        except asyncio.CancelledError:
            raise
        except Exception as e:
            _log.warning("Anomaly metrics export failed: %s", e, exc_info=True)
        await asyncio.sleep(ANOMALY_METRICS_INTERVAL_SECONDS)
