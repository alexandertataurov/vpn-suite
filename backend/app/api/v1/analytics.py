"""Analytics gateway — stable endpoints for Admin Dashboard.

Queries Prometheus server-side. Normalized responses, caching, graceful degradation.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from app.core.constants import PERM_CLUSTER_READ, PERM_CLUSTER_WRITE
from app.core.rbac import require_permission
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


async def _find_container_for_job(
    docker_service,
    job: str,
    host_id: str = "local",
):
    """Best-effort mapping from Prometheus job -> Docker container."""
    containers = await docker_service.list_containers(host_id, force_refresh=True)
    job_norm = (job or "").strip().lower()
    if not job_norm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job is required",
        )

    exact: list = []
    fuzzy: list = []
    for c in containers:
        name = (getattr(c, "name", "") or "").lower()
        service = (getattr(c, "compose_service", "") or "").lower()
        if service == job_norm or name == job_norm:
            exact.append(c)
        elif job_norm in service or job_norm in name:
            fuzzy.append(c)

    candidates = exact or fuzzy
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No container found for scrape job {job!r}",
        )

    def _score(c) -> tuple[int, int]:
        state = str(getattr(c, "state", "") or "").lower()
        is_running = 1 if state == "running" else 0
        is_loop = 1 if getattr(c, "is_restart_loop", False) else 0
        return (is_running, -is_loop)

    candidates.sort(key=_score, reverse=True)
    return candidates[0]


@router.post(
    "/telemetry/services/{job}/{action}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def control_telemetry_service(
    request: Request,
    job: str,
    action: str,
    _admin=Depends(require_permission(PERM_CLUSTER_WRITE)),
) -> Response:
    """Start/stop/restart a scrape service by Prometheus job name.

    Implementation detail: maps job -> Docker container (compose_service/name)
    on the local Docker telemetry host and proxies to docker telemetry service.
    """
    docker_service = getattr(request.app.state, "docker_telemetry_service", None)
    if docker_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="docker telemetry service unavailable",
        )

    action_norm = (action or "").strip().lower()
    if action_norm not in ("start", "stop", "restart"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="action must be one of: start, stop, restart",
        )

    container = await _find_container_for_job(docker_service, job, host_id="local")
    try:
        if action_norm == "start":
            await docker_service.start_container(container.host_id, container.container_id)
        elif action_norm == "stop":
            await docker_service.stop_container(container.host_id, container.container_id)
        else:
            await docker_service.restart_container(container.host_id, container.container_id)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"scrape service {action_norm} failed: {exc}",
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
            'sum(rate(http_requests_total{status_class="5xx"}[5m])) / sum(rate(http_requests_total[5m]))'
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
    # When there have been no 5xx responses in the window, Prometheus returns an
    # empty vector for the error-rate expression. Treat that as 0 instead of
    # "missing" so the UI shows 0% rather than "—".
    if err is None:
        err = 0.0
    p95 = _first_value(data.get("p95", []))

    return MetricsKpisOut(
        request_rate_5m=rate,
        error_rate_5m=err,
        latency_p95_seconds=p95,
        prometheus_available=True,
    )
