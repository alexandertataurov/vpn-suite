"""Periodic task: compute revenue KPIs from DB and update Prometheus gauges."""

from __future__ import annotations

import asyncio
import logging
import time

from app.core.database import async_session_factory
from app.services.admin_revenue_service import get_revenue_overview

try:
    from app.core.metrics import (
        redis_latency_seconds,
        vpn_revenue_arpu,
        vpn_revenue_arr,
        vpn_revenue_churn_rate,
        vpn_revenue_conversion_rate,
        vpn_revenue_expiry_forecast_30d,
        vpn_revenue_mrr,
        vpn_revenue_per_server,
        vpn_revenue_renewal_rate,
        vpn_revenue_subscriptions_active,
    )
except Exception:
    redis_latency_seconds = None
    vpn_revenue_mrr = None
    vpn_revenue_subscriptions_active = None
    vpn_revenue_arr = None
    vpn_revenue_arpu = None
    vpn_revenue_conversion_rate = None
    vpn_revenue_renewal_rate = None
    vpn_revenue_churn_rate = None
    vpn_revenue_expiry_forecast_30d = None
    vpn_revenue_per_server = None

_log = logging.getLogger(__name__)

REVENUE_METRICS_INTERVAL_SECONDS = 600  # 10 min


async def _update_revenue_gauges() -> None:
    if vpn_revenue_mrr is None:
        return
    async with async_session_factory() as session:
        try:
            data = await get_revenue_overview(session)
        except Exception as e:
            _log.warning("Revenue overview failed: %s", e, exc_info=True)
            return
    try:
        vpn_revenue_subscriptions_active.set(data.get("subscriptions_active", 0))
        vpn_revenue_mrr.set(data.get("mrr", 0))
        vpn_revenue_arr.set(data.get("arr", 0))
        vpn_revenue_arpu.set(data.get("arpu", 0))
        vpn_revenue_conversion_rate.set(data.get("trial_conversion_pct", 0))
        vpn_revenue_renewal_rate.set(data.get("renewal_rate", 0))
        vpn_revenue_churn_rate.set(data.get("churn_rate", 0))
        vpn_revenue_expiry_forecast_30d.set(data.get("expiring_30d", 0))
        per_server = data.get("revenue_per_server") or {}
        for server_id, count in per_server.items():
            vpn_revenue_per_server.labels(server_id=str(server_id)).set(count)
        if redis_latency_seconds is not None:
            try:
                from app.core.redis_client import get_redis

                r = get_redis()
                if r:
                    t0 = time.perf_counter()
                    await r.ping()
                    redis_latency_seconds.observe(time.perf_counter() - t0)
            except Exception:
                pass
    except Exception as e:
        _log.warning("Update revenue gauges failed: %s", e, exc_info=True)


async def run_revenue_metrics_loop() -> None:
    """Run revenue metrics update every REVENUE_METRICS_INTERVAL_SECONDS."""
    if vpn_revenue_mrr is None:
        _log.info("Revenue metrics disabled (metrics not loaded)")
        return
    _log.info(
        "Revenue metrics task starting (interval=%ss)",
        REVENUE_METRICS_INTERVAL_SECONDS,
    )
    while True:
        try:
            await _update_revenue_gauges()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            _log.warning("Revenue metrics task error: %s", e, exc_info=True)
        await asyncio.sleep(REVENUE_METRICS_INTERVAL_SECONDS)
