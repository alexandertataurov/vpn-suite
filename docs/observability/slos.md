# SLOs and Error Budgets (Lightweight)

Minimal, explicit SLOs aligned with existing alerts. See `config/monitoring/alert_rules.yml` for alert definitions.

## admin-api (P0)

| SLI | Target | Notes |
|-----|--------|--------|
| Latency p95 | < 2s | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` |
| 5xx rate | < 1% | `rate(http_requests_total{status_class="5xx"}[5m]) / rate(http_requests_total[5m])` |
| Readiness | DB + Redis OK, cluster health ≥ 0.5 (when nodes exist) | GET /health/ready → 200 |

**SLO:** 99% of requests successful (2xx/3xx); readiness reflects dependency health.

## Workers (in-process loops, admin-api)

| Loop | SLI | Target |
|------|-----|--------|
| Reconciliation | Success per cycle | At least one success in 15m (alert: VpnReconciliationStalled) |
| Server sync | Success or backoff | Backoff on failure; server_sync_total by status |
| Health check | Per-server success | Log + optional health_check_failures_total |

## telegram-vpn-bot (P1)

| SLI | Target |
|-----|--------|
| /healthz 200 | Availability 99% |

## node-agent (P1)

| SLI | Target |
|-----|--------|
| Heartbeat success | At least one heartbeat every 5m when agent profile is used |
| last_success_timestamp | Exposed via control-plane or agent /metrics (vpn_node_last_seen_seconds when scraped) |
