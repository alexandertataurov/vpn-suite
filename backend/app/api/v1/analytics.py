"""Analytics gateway — stable endpoints for Admin Dashboard.

Queries Prometheus server-side. Normalized responses, caching, graceful degradation.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.constants import PERM_CLUSTER_READ
from app.core.rbac import require_permission
from pydantic import BaseModel

from app.services.prometheus_query_service import PrometheusQueryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

_CACHE: dict[str, tuple[float, Any]] = {}
_CACHE_TTL_SECONDS = 30


async def _cached_get(key: str, fetch_fn) -> Any:
    """Simple TTL cache for heavy Prometheus queries."""
    now = time.time()
    if key in _CACHE:
        cached_at, value = _CACHE[key]
        if now - cached_at < _CACHE_TTL_SECONDS:
            return value
    value = await fetch_fn()
    _CACHE[key] = (now, value)
    return value


class ServiceScrapeStatus(BaseModel):
    job: str
    instance: str
    health: str  # "up" | "down"
    last_scrape: str | None  # ISO8601
    last_error: str | None


class TelemetryServicesOut(BaseModel):
    services: list[ServiceScrapeStatus]
    prometheus_available: bool
    message: str | None = None  # error or degraded message


@router.get("/telemetry/services", response_model=TelemetryServicesOut)
async def get_telemetry_services(
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
) -> TelemetryServicesOut:
    """Per-service scrape status for Admin Dashboard. Cached 30s. Graceful degradation when Prometheus unavailable."""
    prom = PrometheusQueryService()
    if not prom.enabled:
        return TelemetryServicesOut(
            services=[],
            prometheus_available=False,
            message="Prometheus not configured (TELEMETRY_PROMETHEUS_URL unset)",
        )

    async def _fetch():
        data = await prom.targets()
        return data

    try:
        data = await _cached_get("analytics:targets", _fetch)
    except Exception as e:
        logger.warning("analytics/telemetry/services prometheus fetch failed: %s", e)
        return TelemetryServicesOut(
            services=[],
            prometheus_available=False,
            message=f"Prometheus unavailable: {e!s}",
        )

    if not isinstance(data, dict):
        return TelemetryServicesOut(
            services=[],
            prometheus_available=True,
            message="Invalid targets response",
        )

    active = data.get("activeTargets") or []
    services: list[ServiceScrapeStatus] = []
    for t in active if isinstance(active, list) else []:
        if not isinstance(t, dict):
            continue
        labels = t.get("labels") or {}
        job = labels.get("job", "unknown")
        instance = t.get("scrapeUrl", "") or labels.get("instance", "unknown")
        health = "up" if t.get("health") == "up" else "down"
        last_scrape = t.get("lastScrape")  # ISO8601 string
        last_error = t.get("lastError") or None
        services.append(
            ServiceScrapeStatus(
                job=str(job),
                instance=str(instance),
                health=health,
                last_scrape=last_scrape,
                last_error=last_error,
            )
        )

    return TelemetryServicesOut(
        services=services,
        prometheus_available=True,
    )


class MetricsKpisOut(BaseModel):
    request_rate_5m: float | None  # requests/sec
    error_rate_5m: float | None  # 5xx fraction 0-1
    latency_p95_seconds: float | None
    prometheus_available: bool
    message: str | None = None


@router.get("/metrics/kpis", response_model=MetricsKpisOut)
async def get_metrics_kpis(
    _admin=Depends(require_permission(PERM_CLUSTER_READ)),
) -> MetricsKpisOut:
    """Aggregated KPIs: request rate, error rate, p95 latency. Cached 30s."""
    prom = PrometheusQueryService()
    if not prom.enabled:
        return MetricsKpisOut(
            request_rate_5m=None,
            error_rate_5m=None,
            latency_p95_seconds=None,
            prometheus_available=False,
            message="Prometheus not configured",
        )

    async def _fetch():
        rate_res = await prom.query("sum(rate(http_requests_total[5m]))")
        err_res = await prom.query(
            "sum(rate(http_requests_total{status_class=\"5xx\"}[5m])) / sum(rate(http_requests_total[5m]))"
        )
        p95_res = await prom.query(
            "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
        )
        return {"rate": rate_res, "err": err_res, "p95": p95_res}

    try:
        data = await _cached_get("analytics:kpis", _fetch)
    except Exception as e:
        logger.warning("analytics/metrics/kpis fetch failed: %s", e)
        return MetricsKpisOut(
            request_rate_5m=None,
            error_rate_5m=None,
            latency_p95_seconds=None,
            prometheus_available=True,
            message=str(e),
        )

    def _first_value(res: list) -> float | None:
        if res and isinstance(res[0], dict):
            v = res[0].get("value")
            if v is not None and len(v) >= 2:
                try:
                    return float(v[1])
                except (ValueError, TypeError):
                    pass
        return None

    rate = _first_value(data.get("rate", []))
    err = _first_value(data.get("err", []))
    p95 = _first_value(data.get("p95", []))

    return MetricsKpisOut(
        request_rate_5m=rate,
        error_rate_5m=err,
        latency_p95_seconds=p95,
        prometheus_available=True,
    )
