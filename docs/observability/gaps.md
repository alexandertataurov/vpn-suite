# Observability — Gap Analysis

**Phase 0 deliverable.** Critical gaps, label inconsistencies, dead pipelines, and silent failure risks. Every claim links to file paths or config keys.

---

## 1. Critical Gaps

| # | Gap | Evidence |
|---|-----|----------|
| 1 | **manage.sh up-monitoring does NOT start discovery-runner** | [`manage.sh`](../../manage.sh) L56 runs `prometheus cadvisor node-exporter loki promtail grafana` only. discovery-runner lives in [`docker-compose.observability.yml`](../../docker-compose.observability.yml). Default `manage.sh` uses single [`docker-compose.yml`](../../docker-compose.yml); observability compose not wired. |
| 2 | **TELEMETRY_PROMETHEUS_URL empty by default** | [`.env.example`](../../.env.example) L47: `TELEMETRY_PROMETHEUS_URL=`. Admin overview/operator and health-snapshot return degraded/missing when unset ([`config.py`](../../backend/app/core/config.py) L74). |
| 3 | **No tracing** | No OTel, Tempo, or Jaeger. [`docs/observability/diagnostics-upgrade-report.md`](diagnostics-upgrade-report.md) L92: "OpenTelemetry \| Not integrated". |
| 4 | **node-agent / wg-exporter conditional** | discovery-runner adds node-agent, telegram-vpn-bot, wg-exporter targets only when containers detected ([`ops/discovery/__main__.py`](../../ops/discovery/__main__.py) L95–114). Without discovery-runner, static targets.json may omit them. |
| 5 | **reverse-proxy has no metrics** | Caddy exposes no Prometheus metrics. |
| 6 | **Docker telemetry optional** | `DOCKER_TELEMETRY_HOSTS_JSON` empty = Telemetry > Docker Services disabled ([`telemetry_docker.py`](../../backend/app/api/v1/telemetry_docker.py)). |
| 7 | **correlation_engine stub** | [`correlation_engine.py`](../../ops/discovery/correlation_engine.py): `correlate()` returns `[]`; mapping.json stays empty. |

---

## 2. Label Consistency

- Prometheus jobs use `sd_job` and `host_id` from file_sd ([`prometheus.yml`](../../config/monitoring/prometheus.yml), [`__main__.py`](../../ops/discovery/__main__.py) L90–95).
- Backend metrics use `path_template`, `status_class`, `method` ([`prometheus_middleware.py`](../../backend/app/core/prometheus_middleware.py) L12–18).
- **Missing:** No standardized `service.name`, `env`, `node_id`, `version` labels across exporters.

---

## 3. Duplicate / Redundant Pipelines

- ~~**inventory** service~~ — removed; discovery-runner produces targets.json.

---

## 4. amnezia-awg2 (VPN Server) Gaps

| # | Gap | Evidence |
|---|-----|----------|
| 8 | **wg-exporter missing labels** | No `instance`, `node_id`, or `server_id` to correlate with control-plane topology. |
| 9 | **Per-peer metadata not exported** | `awg show dump` has endpoint, allowed_ips; wg-exporter only exposes rx/tx/handshake ([`wg_exporter.py`](../../monitoring/wg-exporter/wg_exporter.py) L39–59). |
| 10 | **wg-exporter host-bound** | Must run on each VPN node. Discovery adds `host.docker.internal:9586` when reachable ([`__main__.py`](../../ops/discovery/__main__.py) L110–114). Multi-node requires wg-exporter per host. |

---

## 5. Silent Failure Risks

| Risk | Cause | Mitigation |
|------|-------|------------|
| Scrape failures invisible | Prometheus `up{job="..."}==0` exists in alert_rules but no dashboard for scrape status | Add scrape-status panel; expose `/_debug/metrics-targets` in Admin UI |
| Admin dashboard degrades silently | `TELEMETRY_PROMETHEUS_URL` empty → overview/operator returns degraded; UI may not show explicit error | Ensure UI shows "metrics unavailable" when `metrics_freshness` is missing/degraded ([`overview.py`](../../backend/app/api/v1/overview.py)) |
| discovery-runner not running | manage.sh up-monitoring never starts it; targets.json stale | Wire observability compose into manage.sh or document explicit compose command |

---

## 6. Missing Metrics / Endpoints

- **admin-api:** RED metrics exist (http_requests_total, http_request_duration_seconds); no DB connection pool or query latency.
- **reverse-proxy:** No Prometheus metrics.
- **postgres, redis:** No exporters (container healthcheck only).
- **amnezia-awg:** No native /metrics; depends on wg-exporter for WireGuard metrics.

---

## 7. Dashboards and Brittle Endpoints

- Grafana dashboards provisioned from [`config/monitoring/grafana/`](../../config/monitoring/grafana/); may rely on `up`, `rate(http_requests_total[5m])` — fail gracefully when jobs missing.
- No explicit health check for Prometheus scrape targets in Admin Dashboard; `/_debug/metrics-targets` exists but may not be surfaced.
