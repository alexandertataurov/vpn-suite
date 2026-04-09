# Phase 4 — Observability Check

**Deliverable:** Observability verification report. Metrics, logs, traces, alerts, archive pipeline.

---

## 1. Stack Overview

| Component | Config | Retention | Status |
|-----------|--------|-----------|--------|
| Prometheus | `config/monitoring/prometheus.yml` | 365d (compose arg) | OK |
| Loki | `config/monitoring/loki-config.yml` | 8760h (365d) | OK |
| Tempo | `config/monitoring/tempo/tempo.yaml` | 8760h (365d) | OK |
| Grafana | `config/monitoring/grafana/`, dashboards | — | OK |
| OTEL Collector | `otel-collector/config.yaml` | — | OK |
| Alerts | `config/monitoring/alerts/unified-alerts.yml` | — | OK |

---

## 2. Metrics

### 2.1 Prometheus Targets

| Job | Source | Labels |
|-----|--------|--------|
| admin-api | file_sd (targets.json) | service_name, node_id |
| cadvisor | file_sd | service_name, node_id |
| node-exporter | file_sd | service_name, node_id |
| node-agent | file_sd | service_name, node_id |
| telegram-vpn-bot | file_sd | service_name, node_id |
| wg-exporter | file_sd | service_name, node_id |

**Discovery:** `infra/discovery/runtime/run_loop.py` → writes targets.json. Supports `DISCOVERY_REMOTE_WG_EXPORTERS` for multi-host wg-exporter.

### 2.2 Admin API → Prometheus

- **TELEMETRY_PROMETHEUS_URL:** Set in monitoring profile; empty by default → analytics/overview degrade gracefully.
- **Analytics endpoints:** `/analytics/telemetry/services`, `/analytics/metrics/kpis` query Prometheus; return `prometheus_available: false` when unset.

---

## 3. Logs

- **Loki:** 365d retention, compactor enabled, retention_delete_delay 2h.
- **Archive:** `scripts/archive-loki-to-s3.sh` — sync chunks to S3 before deletion. Requires `LOKI_ARCHIVE_S3_BUCKET`, `LOKI_DATA_PATH`. Cron: `0 2 * * *` (daily).

---

## 4. Traces

- **OTEL_TRACES_ENDPOINT:** Opt-in (e.g. `otel-collector:4317` in `infra/compose/docker-compose.observability.yml`).
- **Instrumented:** admin-api, telegram-vpn-bot.
- **Tempo:** OTLP receiver (grpc 4317, http 4318), block retention 365d.

---

## 5. Alerts (unified-alerts.yml)

| Alert | Expr | For | Severity |
|-------|------|-----|----------|
| PrometheusTargetDown | `up == 0` | 5m | warning |
| HighNodeCpu | CPU idle < 15% | 10m | warning |
| HighNodeMemory | MemAvailable < 10% | 10m | warning |
| VpnHandshakeAgeHigh | `agent_last_handshake_max_age_seconds > 1800` | 10m | warning |
| VpnPeersDrop | `agent_peers_active == 0` and runtime peers > 0 | 10m | warning |

---

## 6. wg-exporter

- **Labels:** `node_id`, `server_id` from env (relabel_configs carry host_id → node_id).
- **Metrics:** `wireguard_latest_handshake_seconds`, peer stats.

---

## 7. Grafana

- **vpn-overview.json:** VPN dashboard; uses `node_id`, `server_id` labels.
- **Datasources:** Prometheus, Loki, Tempo (via monitoring profile).

---

## 8. Release Validation Checklist

- [x] Prometheus retention 365d (compose)
- [x] Loki retention 8760h
- [x] Tempo block_retention 8760h
- [x] relabel_configs: service_name, node_id
- [x] wg-exporter node_id, server_id labels
- [x] Admin API + bot: OTEL instrumentation
- [x] Archive pipeline docs + script (Loki → S3)
- [x] unified-alerts.yml
- [x] Grafana vpn-overview dashboard
- [x] discovery-runner: DISCOVERY_REMOTE_WG_EXPORTERS (multi-host)
- [x] UI: ScrapeStatusPanel (metrics unavailable when degraded)

---

## 9. Summary

| Area | Status |
|------|--------|
| Metrics (Prometheus) | OK |
| Logs (Loki) | OK |
| Traces (Tempo/OTEL) | OK |
| Alerts | OK |
| Archive pipeline | OK (Loki S3 script) |
| Admin analytics API | OK (graceful degradation) |
| Discovery multi-host | OK |

**Recommendation:** Run `./manage.sh up-monitoring` before release to verify stack starts; set TELEMETRY_PROMETHEUS_URL for production.
