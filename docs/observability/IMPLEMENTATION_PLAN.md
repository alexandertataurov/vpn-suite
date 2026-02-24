# Observability — Master Implementation Plan

**Master plan and todos for full observability consolidation and beyond.**

---

## Phase 0 — Inventory & Current-State ✅

| # | Task | Status | Deliverable |
|---|------|--------|-------------|
| 0.1 | Service discovery inventory | Done | `current-state.md` |
| 0.2 | Dataflow diagram | Done | `current-state.md` |
| 0.3 | Gap analysis | Done | `gaps.md` |

---

## Phase 1 — Target Architecture ✅

| # | Task | Status | Deliverable |
|---|------|--------|-------------|
| 1.1 | Design target architecture | Done | `target-architecture.md` |
| 1.2 | Document 365d retention + archive | Done | `target-architecture.md` §7 |
| 1.3 | Document rx/tx counter-reset limitation | Done | `target-architecture.md` §8 |

---

## Phase 2 — Consolidated Observability Stack

### 2.1 Exporters & Instrumentation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1.1 | Add `service.name`, `env`, `node_id` to Prometheus relabel_configs | Todo | [prometheus.yml](../../config/monitoring/prometheus.yml) |
| 2.1.2 | wg-exporter: add `node_id`, `server_id` labels (from env) | Todo | [wg_exporter.py](../../monitoring/wg-exporter/wg_exporter.py) |
| 2.1.3 | wg-exporter: expose per-peer `endpoint`, `allowed_ips` (optional) | Todo | Parse full dump |
| 2.1.4 | admin-api: add `version` label to /metrics | Todo | From API_VERSION |
| 2.1.5 | Add RED metrics to any HTTP service missing them | Todo | bot, node-agent |
| 2.1.6 | Instrument admin-api with OpenTelemetry (OTLP traces) | Todo | opentelemetry-instrumentation-fastapi |
| 2.1.7 | Instrument telegram-vpn-bot with OpenTelemetry | Todo | OTLP export to otel-collector |
| 2.1.8 | Add Caddy metrics (or Caddy Prometheus plugin) | Todo | Gap #5; optional |
| 2.1.9 | postgres-exporter (optional) | Todo | Gap; low priority |
| 2.1.10 | redis-exporter (optional) | Todo | Gap; low priority |

### 2.2 OTEL Collector & Tempo

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.2.1 | OTEL Collector config | Done | `config/monitoring/otel-collector/config.yaml` |
| 2.2.2 | Tempo config | Done | `config/monitoring/tempo/tempo.yaml` |
| 2.2.3 | Grafana Tempo datasource | Done | `grafana/provisioning/datasources/` |
| 2.2.4 | Wire OTEL Collector to admin-api OTLP endpoint | Todo | When 2.1.6 done |
| 2.2.5 | Validate trace flow end-to-end | Todo | admin-api → otel-collector → tempo → Grafana |

### 2.3 Storage & Retention

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.3.1 | Prometheus: set `--storage.tsdb.retention.time=365d` | Todo | docker-compose |
| 2.3.2 | Loki: set `retention_period: 8760h` (365d) | Todo | [loki-config.yml](../../config/monitoring/loki-config.yml) |
| 2.3.3 | Tempo: set `block_retention: 8760h` | Todo | [tempo.yaml](../../config/monitoring/tempo/tempo.yaml) |
| 2.3.4 | Add VictoriaMetrics (or Mimir) for 365d + counter-reset handling | Todo | Optional; replace or complement Prometheus |
| 2.3.5 | Archive pipeline: export >365d to S3/GCS | Todo | Cron job or compactor |
| 2.3.6 | Recording rules for rx/tx `increase()` over 1d windows | Todo | For continuous metrics across restarts |

### 2.4 Compose & manage.sh

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.4.1 | Wire DC_OBS (observability compose) into manage.sh | Done | [manage.sh](../../manage.sh) |
| 2.4.2 | Start discovery-runner, wg-exporter, tempo, otel-collector | Done | manage.sh up-monitoring |
| 2.4.3 | TELEMETRY_PROMETHEUS_URL in .env.example with comment | Todo | Default empty; doc when to set |
| 2.4.4 | Ensure discovery-runner writes targets before Prometheus scrape | Todo | Startup order / healthcheck |

### 2.5 Service docs

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.5.1 | docs/observability/services/*.md | Done | admin-api, bot, node-agent, wg-exporter, amnezia-awg2 |
| 2.5.2 | Update service docs when instrumentation changes | Todo | Ongoing |

---

## Phase 3 — Admin Dashboard Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | GET /api/v1/analytics/telemetry/services | Done | [analytics.py](../../backend/app/api/v1/analytics.py) |
| 3.2 | Caching for heavy Prometheus queries (30s TTL) | Done | analytics.py |
| 3.3 | Graceful degradation when Prometheus down | Done | analytics.py |
| 3.4 | GET /api/v1/analytics/metrics/kpis | Todo | Request rate, error rate, latency |
| 3.5 | Wire Admin UI to /analytics/telemetry/services | Todo | Show per-service up/down, last scrape |
| 3.6 | UI: explicit "metrics unavailable" when degraded | Todo | [overview.py](../../backend/app/api/v1/overview.py) |
| 3.7 | Add Grafana scrape-status dashboard panel | Todo | `up`, targets |
| 3.8 | OpenAPI/TS types for analytics endpoints | Todo | [analytics-api.md](analytics-api.md) |
| 3.9 | Expose /_debug/metrics-targets in Admin UI (optional) | Todo | For ops debugging |

---

## Phase 4 — Legacy & Dead Code Cleanup

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Legacy removal plan | Done | [legacy-removal-plan.md](legacy-removal-plan.md) |
| 4.2 | Remove inventory service (after parity verified) | Todo | docker-compose.observability.yml |
| 4.3 | Remove or implement correlation_engine | Todo | mapping.json |
| 4.4 | Remove INVENTORY_DISABLED env var | Todo | When inventory removed |
| 4.5 | Consolidate/supersede obsolete observability docs | Partial | system-map.md removed; others as needed |
| 4.6 | CHANGELOG migration note | Todo | When legacy removed |
| 4.7 | Grep proof: no references to old pipeline | Todo | Verification |

---

## Phase 5 — Multi-Node & VPN Server

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | discovery-runner: add remote wg-exporter targets (multi-host) | Todo | Config for node IPs |
| 5.2 | wg-exporter: run on each VPN node (amnezia-awg2) | Todo | Deploy script / compose |
| 5.3 | amnezia-awg2: document wg-exporter deployment | Todo | [amnezia-awg2.md](services/amnezia-awg2.md) |
| 5.4 | Prometheus: scrape remote wg-exporter by node_id | Todo | file_sd or static config |
| 5.5 | Admin dashboard: per-node VPN metrics (peers, rx/tx rate) | Todo | From wireguard_* metrics |

---

## Phase 6 — Alerts & Dashboards

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Grafana: VPN overview dashboard (peers, rx/tx rate) | Todo | wireguard_* metrics |
| 6.2 | Grafana: scrape-failure panel | Todo | `up==0` |
| 6.3 | Alertmanager: wire to notification channels | Todo | Slack/PagerDuty/email |
| 6.4 | SLO dashboards (availability, latency) | Todo | [slos.md](slos.md) |
| 6.5 | Trace drilldown from logs (Loki ↔ Tempo) | Todo | When traces instrumented |

---

## Phase 7 — Security & Hardening

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Prometheus/Loki/Grafana behind reverse proxy (prod) | Todo | Caddy or nginx |
| 7.2 | Auth for Grafana (already GF_SECURITY_ADMIN_PASSWORD) | Done | |
| 7.3 | OTLP ingestion auth (optional) | Todo | API key if collector exposed |
| 7.4 | TLS for Prometheus remote_write (if used) | Todo | |
| 7.5 | Restrict /metrics endpoints to internal network | Todo | Firewall / network policy |

---

## Phase 8 — Verification & Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | verification.md | Done | [verification.md](verification.md) |
| 8.2 | CI: smoke test observability stack | Todo | docker compose up, curl metrics |
| 8.3 | E2E: Admin dashboard shows telemetry services | Todo | Playwright |
| 8.4 | Load test: verify 365d retention disk usage | Todo | Capacity planning |
| 8.5 | Counter-reset test: restart awg, verify increase() correct | Todo | Manual or script |

---

## Beyond — Future Work

| # | Area | Task |
|---|------|------|
| B.1 | OTLP metrics | Migrate from prometheus_client to OTLP metrics (dual-write or full migration) |
| B.2 | OTEL logs | Forward app logs via OTLP to Loki |
| B.3 | Profiling | Add Pyroscope or similar for Python profiling |
| B.4 | SLOs | Formal SLO definitions + error budget alerts |
| B.5 | Cost | Monitor observability stack cost (disk, memory) |
| B.6 | Runbooks | Link alerts to runbooks (Grafana annotations) |
| B.7 | Trace sampling | Configure head/tail sampling in OTEL Collector |
| B.8 | Multi-tenancy | If multi-tenant, add X-Scope-OrgID for Loki/Tempo |
| B.9 | amnezia-awg obfuscation params | Expose Jc, Jmin, Jmax, S1, S2, H1–H4 as metrics (awg show) |
| B.10 | DB query latency | Add SQLAlchemy/asyncpg query timing to admin-api |

---

## Todo Summary (Trackable)

```
Phase 2.1: [ ] 2.1.1–2.1.10  (labels, wg-exporter, OTEL instrumentation)
Phase 2.2: [x] 2.2.1–2.2.3   [ ] 2.2.4–2.2.5  (trace flow)
Phase 2.3: [ ] 2.3.1–2.3.6   (365d retention, archive)
Phase 2.4: [x] 2.4.1–2.4.2   [ ] 2.4.3–2.4.4
Phase 3:   [x] 3.1–3.3       [ ] 3.4–3.9
Phase 4:   [x] 4.1           [ ] 4.2–4.7
Phase 5:   [ ] 5.1–5.5       (multi-node)
Phase 6:   [ ] 6.1–6.5       (dashboards, alerts)
Phase 7:   [ ] 7.1–7.5       (security)
Phase 8:   [x] 8.1           [ ] 8.2–8.5
Beyond:    [ ] B.1–B.10
```
