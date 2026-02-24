# admin-api — Observability

**Service:** Control-plane API (FastAPI)  
**Path:** [`backend/`](../../backend)  
**Port:** 8000  

## Metrics

| Endpoint | Format | Source |
|----------|--------|--------|
| `GET /metrics` | Prometheus | [`main.py`](../../backend/app/main.py) L251, `prometheus_client.REGISTRY` |

**Key metrics:** `http_requests_total`, `http_request_duration_seconds`, `vpn_nodes_total`, `vpn_cluster_health_score`, `auth_failures_total` (see [`core/metrics.py`](../../backend/app/core/metrics.py)).

## Health

- `GET /health` — liveness
- `GET /health/ready` — readiness (DB, Redis, cluster health)

## Logs

JSON, `request_id`, `trace_id` (from [`logging_config.py`](../../backend/app/core/logging_config.py)).

## Tracing

**Current:** OpenTelemetry OTLP → otel-collector:4317 when `OTEL_TRACES_ENDPOINT` is set (e.g. in monitoring profile via `docker-compose.observability.yml`). Uses `opentelemetry-instrumentation-fastapi` for automatic span creation.

## Labels to add

`service.name=admin-api`, `env`, `version` (from `API_VERSION`).
