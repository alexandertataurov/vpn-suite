# Production Observability Folder Structure

Key paths for metrics, alerts, dashboards, and docs.

## Config and Rules

| Path | Purpose |
|------|--------|
| `config/monitoring/prometheus.yml` | Prometheus scrape config, file_sd, remote_write, rule_files |
| `config/monitoring/alert_rules.yml` | Alert rules (vpn-suite, admin-operator, docker-telemetry, business, infra, application) |
| `config/monitoring/recording_rules.yml` | Recording rules (wireguard 1d, http latency quantiles) |
| `config/monitoring/alertmanager.yml` | Alertmanager route tree, receivers, inhibit rules |
| `config/monitoring/discovery/` | file_sd targets (targets.json written by discovery-runner) |
| `config/monitoring/loki-config.yml` | Loki server and retention |
| `config/monitoring/promtail-config.yml` | Promtail scrape Docker logs |
| `config/monitoring/tempo/` | Tempo config |
| `config/monitoring/otel-collector/config.yaml` | OTEL Collector OTLP → Tempo |
| `config/monitoring/grafana/provisioning/` | Datasources and dashboard provisioning |
| `config/monitoring/grafana/dashboards/` | Dashboard JSON (VPN Suite - Executive, Infrastructure, Node Health, etc.) |
| `ALERTS/unified-alerts.yml` | Additional alert group (unified-observability) |

## Application Metrics and Tasks

| Path | Purpose |
|------|--------|
| `backend/app/core/metrics.py` | All Prometheus metrics (cluster, revenue, abuse, reconciliation, miniapp, Redis) |
| `backend/app/core/revenue_metrics_task.py` | Periodic revenue KPIs → gauges |
| `backend/app/core/anomaly_metrics_task.py` | Periodic anomaly_metrics export → gauges |
| `backend/app/core/admin_control_center_task.py` | Abuse detection loop + gauge/counter export |
| `backend/app/services/reconciliation_engine.py` | Reconciliation + ghost/expired_active gauges |
| `bot/metrics.py` | Bot counters (commands, trial, payment, retries) |
| `monitoring/wg-exporter/wg_exporter.py` | WireGuard metrics (peers, rx/tx, handshake stale count) |

## Discovery and Worker

| Path | Purpose |
|------|--------|
| `ops/discovery/` | discovery-runner: populate targets.json for Prometheus |
| `backend/app/worker_main.py` | Worker entrypoint; runs revenue_metrics, anomaly_metrics, reconciliation, etc. |

## Scripts and Docs

| Path | Purpose |
|------|--------|
| `scripts/archive-prometheus-to-s3.sh` | Archive Prometheus TSDB to S3 |
| `scripts/archive-loki-to-s3.sh` | Archive Loki to S3 |
| `scripts/archive-tempo-to-s3.sh` | Archive Tempo to S3 |
| `docs/observability/` | ARCHITECTURE.md, METRIC_NAMING.md, logging-architecture.md, TRACE_PROPAGATION.md, ALERT_SPEC.md, ANOMALY_ABUSE.md, RECONCILIATION_MONITORING.md, DASHBOARD_PLAN.md, RETENTION_AND_COST.md, FOLDER_STRUCTURE.md, target-architecture.md, current-state.md, gaps.md |
