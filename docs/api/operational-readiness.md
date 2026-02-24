# Operational Readiness (Observability & Error Handling)

This report reflects behavior observed in code for the Admin API, bot, and node-agent.

---

## Error Handling

- **HTTPException** is normalized to a unified error envelope via `http_exception_to_error_response`.
- **Unhandled exceptions** return a stable 500 envelope and are rate‑limited in logs.
- **Request validation errors (422)** now return the unified error envelope.
  - Evidence: `backend/app/main.py`, `backend/app/core/error_responses.py`, `backend/app/core/error_log_rate_limiter.py`.

### Unified Error Envelope
```
{
  "success": false,
  "data": null,
  "error": { "code": "…", "message": "…", "details": {…} },
  "meta": { "timestamp": "…", "code": 400, "request_id": "…" }
}
```

---

## Request Correlation & Logging

- Request IDs are taken from `X-Request-ID` or generated; stored in `request.state.request_id` and logging context.
- Request start/end events are logged with duration and status.
- Audit middleware attaches actor/context for mutating operations.
  - Evidence: `backend/app/core/request_logging_middleware.py`, `backend/app/core/audit_middleware.py`.

---

## Metrics

- **Admin API:** `/metrics` (Prometheus format)
  - Core metrics in `backend/app/core/metrics.py` include:
    - `http_errors_total`, `auth_failures_total`
    - `vpn_nodes_total`, `vpn_cluster_health_score`, `vpn_node_health`
    - `vpn_reconciliation_*`, `server_sync_*`
    - `funnel_events_total`, `bot_conversion_rate`
- **Node-agent:** `/metrics` exposes agent reconciliation + docker exec metrics.
  - Evidence: `node-agent/agent.py`
- **Bot:** `/metrics` for bot health and internal metrics.
  - Evidence: `bot/main.py`, `bot/metrics.py`

---

## Tracing

- OpenTelemetry tracing is supported and can be enabled via `OTEL_TRACES_ENDPOINT`.
  - Evidence: `backend/app/core/otel_tracing.py`, `backend/app/core/config.py`.

---

## Health Checks

- **Admin API:** `/health` and `/health/ready`
- **Node-agent:** `/healthz`
- **Bot:** `/healthz`

---

## Notes / Gaps

- Success response envelopes are not standardized (varied per endpoint).
- Pagination model is inconsistent across list endpoints (see `docs/api/inconsistencies.md`).
