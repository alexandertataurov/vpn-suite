# Top Findings (Evidence-Based) and Runbook

## Detection queries (LogQL / PromQL)

When monitoring profile is up (Loki + Prometheus):

### Error spikes
- **PromQL:** `rate(http_requests_total{status_class="5xx"}[5m])` — 5xx rate
- **PromQL:** `sum(rate(http_errors_total[5m])) by (error_type)` — errors by type
- **Loki:** `{job="docker-containers"} | json | level="ERROR"` — ERROR log lines

### Slow endpoints
- **PromQL:** `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path_template))` — p95 per path

### Auth
- **PromQL:** `sum(rate(auth_failures_total[5m]))` — auth failure rate (alert: AuthFailuresSpike)

### Retry / backoff
- **Loki:** grep for "backoff", "retry" in admin-api logs (server_sync_loop, reconciliation_engine)

### Bot → panel
- **PromQL:** `rate(bot_requests_total[5m])` by status_class — bot request rate to admin-api

### Node-agent (when scraped)
- **PromQL:** `up{job="node-agent"}` — agent up
- **PromQL:** `vpn_node_last_seen_seconds`, `agent_last_handshake_max_age_seconds` — heartbeat and handshake freshness

---

## Top findings (implemented or documented)

| # | Finding | Evidence | Blast radius | Fix | Verification |
|---|---------|----------|--------------|-----|--------------|
| 1 | 5xx not recorded in metrics | PrometheusMiddleware only recorded on response; exception path skipped | Underreporting; SLO/alert miss outages | PrometheusMiddleware try/except; record 5xx on exception | Trigger 500 → `http_requests_total{status_class="5xx"}` increases |
| 2 | Request log missing on 5xx | RequestLoggingMiddleware logged only in try block | No duration/path for failed requests | Log "request finished" with status=500 in except | Trigger 500 → one "request finished" line with duration_ms |
| 3 | node-agent metrics not scraped | prometheus.yml had no node-agent job | VpnServerOffline / VpnHandshakeFreshnessCollapse never fire | Added job node-agent:9105 | `up{job="node-agent"}` when agent running |
| 4 | Bot has no metrics | No /metrics in bot | No visibility into bot→panel failures | Added bot_requests_total + /metrics + scrape | Grafana panel for bot request rate |
| 5 | No auth_failures metric | No counter for login/refresh failures | Hard to detect brute-force | auth_failures_total + AuthFailuresSpike alert | Alert on spike |
| 6 | Frontend errors lack build/browser | FrontendErrorIn had only message, stack, component_stack | Hard to correlate with deploy/browser | route, buildHash, userAgent in payload and logs | Log sample includes route, user_agent |
| 7 | Health check loop: no per-server metric | health_check_task logs warning only | No dashboard for failing servers | health_check_failures_total{server_id} added | Dashboard panel when building dashboards |
| 8 | Server sync backoff in-memory | _backoff dict in server_sync_loop | After restart, failed servers retry immediately | Document; optional Redis persistence | Documented |
| 9 | Reconciliation backoff | Similar to server sync | Metrics vpn_reconciliation_runs_total sufficient | Alerts VpnReconciliationFailures / Stalled | Already in alert_rules |
| 10 | Docker telemetry circuit breaker | docker_telemetry_service has circuit + docker_telemetry_upstream_failures_total | — | Ensure metric on dashboard | Add panel when building dashboards |
| 11 | Outline client timeout/retry | outline_client.py has timeout and retry_count | — | No change unless evidence | — |
| 12 | Rate limit login fail-open | login_rate_limit_fail_closed=False when Redis down | Document | Document in runbook | Documented |
| 13 | Caddy/reverse-proxy no metrics | P2 | — | Consider Caddy metrics later | P2 |
| 14 | Loki/Promtail positions | promtail-config positions file + backoff | Prevents re-ingest storm | Document | Documented |
| 15 | HTTPException not in error count | Only unhandled Exception incremented http_errors_total | 4xx/5xx from HTTPException not classified | http_exception_to_error_response increments http_errors_total | All API errors now classified |
| 16 | No trace_id in logs | Logs had request_id only | Harder to correlate across services | trace_id_ctx + set from request_id; X-Request-ID supported | Log line has trace_id |
| 17 | No service/env/version in logs | JsonFormatter had only timestamp, level, message, logger, request_id | Harder to filter by service in multi-service logs | set_log_context(service, env, version) | Log line has service, env, version |
| 18 | Error responses request_id | error_body and http_exception_to_error_response | Already set when request available | — | Verified |
| 19 | Payment webhooks | POST /webhooks/payments/* | Ensure request_id in response and logs | Global middleware sets request_id | Already covered |
| 20 | N+1 / DB latency | No db_query_latency metric | Deferred | Optional histogram later | Deferred |
| 21 | SSE stream context canceled | Caddy logs "aborting with incomplete response", uri=/api/v1/servers/stream, error=context canceled | None | Expected when client disconnects (navigate away, tab close) | No fix needed |

---

## Runbook (short)

1. **High 5xx:** Check `http_requests_total{status_class="5xx"}`, `http_errors_total` by path_template; grep logs for request_id.
2. **Auth spike:** Check `auth_failures_total`; review rate limit and Redis.
3. **Bot errors:** Check `bot_requests_total{status_class=~"5xx|error"}`; bot logs and admin-api health.
4. **Node-agent down:** When profile agent: check `up{job="node-agent"}`, agent logs, network to admin-api.
5. **Loki re-ingest:** promtail positions file and backoff configured; see config/monitoring/promtail-config.yml.
6. **SSE context canceled:** Caddy logs "context canceled" on /api/v1/servers/stream when client disconnects (navigate away, tab close). Expected; no fix needed.
7. **Outline metrics 502:** Upstream `/experimental/server/metrics` returns 400 when metrics not supported. Fixed: API returns empty metrics (200) for 400/404/501.
8. **Control-plane anomaly/security 409:** In agent mode, these endpoints return 409 (AGENT_MODE_UNSUPPORTED). Fixed: frontend stops retry/refetch on 409 and shows "N/A (agent mode)".
