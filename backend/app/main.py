"""Admin API — Control Plane for VPN Suite (AmneziaWG)."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import REGISTRY, generate_latest

from app.api.v1.actions import router as actions_router
from app.api.v1.admin_abuse import router as admin_abuse_router
from app.api.v1.admin_churn import router as admin_churn_router
from app.api.v1.admin_cohorts import router as admin_cohorts_router
from app.api.v1.admin_devops import router as admin_devops_router
from app.api.v1.admin_payments_monitor import router as admin_payments_monitor_router
from app.api.v1.admin_pricing import router as admin_pricing_router
from app.api.v1.admin_promos import router as admin_promos_router
from app.api.v1.admin_revenue import router as admin_revenue_router
from app.api.v1.admin_retention import router as admin_retention_router
from app.api.v1.app_settings import router as app_settings_router
from app.api.v1.admin_configs import router as admin_configs_router
from app.api.v1.agent import router as agent_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bot import router as bot_router
from app.api.v1.cluster import router as cluster_router
from app.api.v1.control_plane import router as control_plane_router
from app.api.v1.devices import router as devices_router
from app.api.v1.log import router as log_router
from app.api.v1.overview import router as overview_router
from app.api.v1.payments import router as payments_router
from app.api.v1.peers import router as peers_router
from app.api.v1.plans import router as plans_router
from app.api.v1.servers import router as servers_router
from app.api.v1.servers_peers import router as servers_peers_router
from app.api.v1.servers_stream import router as servers_stream_router
from app.api.v1.live_metrics import router as live_metrics_router
from app.api.v1.subscriptions import router as subscriptions_router
from app.api.v1.telemetry_snapshot import router as telemetry_snapshot_router
from app.api.v1.telemetry_docker import router as telemetry_docker_router
from app.api.v1.users import router as users_router
from app.api.v1.webapp import router as webapp_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.wg import router as wg_router
from app.core.audit_middleware import AuditMiddleware
from app.core.config import settings
from app.core.database import check_db
from app.core.device_expiry_task import run_device_expiry_loop
from app.core.docker_alert_polling_task import run_docker_alert_poll_loop
from app.core.handshake_quality_gate_task import run_handshake_quality_gate_loop
from app.core.error_responses import error_body, http_exception_to_error_response
from app.core.health_check_task import run_health_check_loop
from app.core.limits_check_task import run_limits_check_loop
from app.core.logging_config import (
    configure_logging,
    extra_for_event,
    request_id_ctx,
    set_log_context,
)
from app.core.metrics import http_errors_total, vpn_suite_info
from app.core.node_scan_task import run_node_scan_loop, run_node_scan_once
from app.core.otel_tracing import setup_otel_tracing
from app.core.db_metrics_middleware import DbMetricsMiddleware
from app.core.prometheus_middleware import PrometheusMiddleware, path_template
from app.core.rate_limit import GlobalAPIRateLimitMiddleware
from app.core.redaction import redact_for_log
from app.core.redis_client import check_redis, close_redis, init_redis
from app.core.request_logging_middleware import RequestLoggingMiddleware
from app.core.server_sync_loop import run_server_sync_loop
from app.core.telemetry_polling_task import run_telemetry_poll_loop
from app.services.docker_telemetry_service import DockerTelemetryService
from app.services.node_runtime import TimingNodeRuntimeAdapter
from app.services.reconciliation_engine import reconcile_all_nodes, run_reconciliation_loop

_log = logging.getLogger(__name__)
# Single source of truth for API version (RC: 0.1.0-rc.1; traceability with CHANGELOG and release-checklist)
API_VERSION = "0.1.0-rc.1"

configure_logging(
    log_json=settings.log_json,
    log_level=settings.log_level,
    env=settings.environment,
)
set_log_context(service="admin-api", env=settings.environment, version=API_VERSION)
vpn_suite_info.labels(version=API_VERSION).set(1)


async def _generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return stable 500 in unified error shape; log full context server-side (P0). Rate-limited."""
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    path_tpl = path_template(request.url.path)
    http_errors_total.labels(path_template=path_tpl, error_type="INTERNAL_ERROR").inc()
    from app.core.error_log_rate_limiter import should_log_error

    redacted = redact_for_log(str(exc))
    if await should_log_error("E_INTERNAL", path_tpl, message=redacted):
        _log.exception(
            "Unhandled exception request_id=%s path=%s error=%s",
            rid,
            request.url.path,
            redacted,
        )
    body = error_body(
        code="INTERNAL_ERROR",
        message="Internal server error",
        status_code=500,
        request_id=rid,
    )
    return JSONResponse(status_code=500, content=body)


async def _validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return unified 422 error shape for validation errors."""
    rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
    path_tpl = path_template(request.url.path)
    http_errors_total.labels(path_template=path_tpl, error_type="VALIDATION_ERROR").inc()
    body = error_body(
        code="VALIDATION_ERROR",
        message="Validation error",
        status_code=422,
        details={"errors": exc.errors()},
        request_id=rid,
    )
    return JSONResponse(status_code=422, content=body)


def _create_node_runtime_adapter():
    """Create docker/agent runtime adapter (control-plane execution channel).

    NOTE: This adapter is used for light, read-heavy operations inside the API process.
    Heavy reconciliation, telemetry, and server-sync loops run in a separate worker
    process (see app.worker_main) to avoid coupling HTTP latency to background work.
    """
    from app.core.config import settings as _settings

    if _settings.node_discovery == "docker":
        from app.services.node_runtime_docker import DockerNodeRuntimeAdapter

        prefixes = (
            getattr(_settings, "docker_vpn_container_prefixes", "amnezia-awg") or "amnezia-awg"
        )
        return DockerNodeRuntimeAdapter(container_filter=prefixes, interface="awg0")
    if _settings.node_discovery == "agent":
        from app.services.node_runtime_agent import AgentNodeRuntimeAdapter

        return AgentNodeRuntimeAdapter()
    raise ValueError(f"NODE_DISCOVERY={_settings.node_discovery!r} not supported")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_production_secrets()
    _log.info(
        "config loaded",
        extra=extra_for_event(event="config.load"),
    )
    _raw_adapter = _create_node_runtime_adapter()
    app.state.node_runtime_adapter = TimingNodeRuntimeAdapter(
        _raw_adapter, adapter_name=settings.node_discovery
    )
    _log.info(
        "startup: node runtime adapter initialized",
        extra=extra_for_event(event="config.load", entity_id=settings.node_discovery),
    )
    app.state.docker_telemetry_service = DockerTelemetryService()
    await init_redis()
    db_ok = await check_db()
    redis_ok = await check_redis()
    _log.info(
        "startup: dependencies check",
        extra=extra_for_event(
            event="config.load",
            entity_id=f"db={'ok' if db_ok else 'fail'},redis={'ok' if redis_ok else 'fail'}",
        ),
    )
    # Background loops moved to dedicated worker process (app.worker_main).
    # The API process still performs light health checks for its own dependencies.
    health_task = asyncio.create_task(run_health_check_loop(lambda: app.state.node_runtime_adapter))
    try:
        yield
    finally:
        health_task.cancel()
        try:
            await health_task
        except asyncio.CancelledError:
            pass
        await close_redis()


app = FastAPI(
    title="VPN Admin API",
    version=API_VERSION,
    description="Control plane for commercial VPN (AmneziaWG).",
    lifespan=lifespan,
)
app.add_exception_handler(HTTPException, http_exception_to_error_response)
app.add_exception_handler(RequestValidationError, _validation_exception_handler)
app.add_exception_handler(Exception, _generic_exception_handler)
# CORS: explicit origins from env; no * in prod (security)
_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GlobalAPIRateLimitMiddleware)
app.add_middleware(PrometheusMiddleware)
app.add_middleware(DbMetricsMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(AuditMiddleware)
app.include_router(app_settings_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(log_router, prefix="/api/v1")
app.include_router(overview_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(admin_revenue_router, prefix="/api/v1")
app.include_router(admin_abuse_router, prefix="/api/v1")
app.include_router(admin_retention_router, prefix="/api/v1")
app.include_router(admin_pricing_router, prefix="/api/v1")
app.include_router(admin_promos_router, prefix="/api/v1")
app.include_router(admin_payments_monitor_router, prefix="/api/v1")
app.include_router(admin_churn_router, prefix="/api/v1")
app.include_router(admin_devops_router, prefix="/api/v1")
app.include_router(admin_cohorts_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(cluster_router, prefix="/api/v1")
app.include_router(control_plane_router, prefix="/api/v1")
app.include_router(peers_router, prefix="/api/v1")
app.include_router(wg_router, prefix="/api/v1")
# Stream before servers_router so GET /servers/stream is not matched by GET /servers/{server_id}
app.include_router(servers_stream_router, prefix="/api/v1")
app.include_router(servers_router, prefix="/api/v1")
app.include_router(actions_router, prefix="/api/v1")
app.include_router(servers_peers_router, prefix="/api/v1")
app.include_router(admin_configs_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(devices_router, prefix="/api/v1")
app.include_router(plans_router, prefix="/api/v1")
app.include_router(subscriptions_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")
app.include_router(telemetry_docker_router, prefix="/api/v1")
app.include_router(telemetry_snapshot_router, prefix="/api/v1")
app.include_router(live_metrics_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(webhooks_router)  # /webhooks/payments/{provider} — no JWT
app.include_router(bot_router, prefix="/api/v1")
app.include_router(webapp_router, prefix="/api/v1")
# Compatibility alias for exact /api/telemetry/docker/* contract.
app.include_router(telemetry_docker_router, prefix="/api", include_in_schema=False)

setup_otel_tracing(app, settings.otel_traces_endpoint)


@app.get("/metrics")
def metrics():
    """Prometheus scrape endpoint. No auth (scrape from internal network)."""
    return Response(
        content=generate_latest(REGISTRY),
        media_type="text/plain; charset=utf-8",
    )


@app.get("/health")
def health():
    """Liveness: returns 200 when process is up. node_mode: mock (no node call) or real."""
    return {"status": "ok", "node_mode": settings.node_mode}
import time

_ready_cache_ts = 0.0
_ready_cache_score = 1.0


@app.get("/health/ready")
async def health_ready(request: Request):
    """Readiness: 200 if DB and Redis reachable and cluster healthy (or no nodes). 503 if cluster health < 0.5."""
    db_ok = await check_db()
    redis_ok = await check_redis()
    if not db_ok or not redis_ok:
        pass  # fall through to 503 below
    else:
        # Optional: fail ready if cluster health score < 0.5 (when we have nodes)
        try:
            adapter = getattr(request.app.state, "node_runtime_adapter", None)
            if adapter is not None:
                global _ready_cache_ts, _ready_cache_score
                now = time.monotonic()
                if now - _ready_cache_ts > 15.0:
                    from app.services.topology_engine import TopologyEngine
    
                    engine = TopologyEngine(adapter)
                    topo = await engine.get_topology()
                    if topo.nodes:
                        _ready_cache_score = topo.health_score or 0.0
                    else:
                        _ready_cache_score = 1.0
                    _ready_cache_ts = now

                if _ready_cache_score < 0.5:
                    from app.core.error_responses import error_body

                    rid = request_id_ctx.get()
                    body = error_body(
                        code="SERVICE_UNAVAILABLE",
                        message="Cluster unhealthy",
                        status_code=503,
                        request_id=rid,
                        details={"cluster_health_score": topo.health_score},
                    )
                    body["status"] = "degraded"
                    return JSONResponse(status_code=503, content=body)
        except Exception as e:
            _log.debug("Ready cluster check failed: %s", e)
        return {"status": "ok", "database": "ok", "redis": "ok"}
    from app.core.error_responses import error_body

    rid = request_id_ctx.get()
    body = error_body(
        code="SERVICE_UNAVAILABLE",
        message="Database or Redis unavailable",
        status_code=503,
        request_id=rid,
        details={
            "database": "ok" if db_ok else "error",
            "redis": "ok" if redis_ok else "error",
        },
    )
    body["status"] = "degraded"
    body["database"] = "ok" if db_ok else "error"
    body["redis"] = "ok" if redis_ok else "error"
    return JSONResponse(status_code=503, content=body)
