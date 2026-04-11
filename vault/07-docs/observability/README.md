# Observability — Docs Index

Index of observability documentation for vpn-suite. For up-to-date external references, see [External documentation](#external-documentation) below.

## Core docs

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/current-state|current-state.md]] | Service discovery inventory and dataflow. |
| [[07-docs/observability/gaps|gaps.md]] | Gap analysis: critical gaps, labels, silent failures. |
| [[07-docs/observability/target-architecture|target-architecture.md]] | Target architecture: Prometheus, Loki, Tempo, OTEL Collector, retention. |
| [[07-docs/observability/IMPLEMENTATION_PLAN|IMPLEMENTATION_PLAN.md]] | Master implementation plan and task status. |
| [[07-docs/observability/OBSERVABILITY-HEALTH-AND-FRONTEND-REVIEW|OBSERVABILITY-HEALTH-AND-FRONTEND-REVIEW.md]] | Observability health signals and Admin frontend integration. |

## Runbooks and verification

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/runbook-observability|runbook-observability.md]] | Deploy, debug, rollback, and security for the observability stack. |
| [[07-docs/observability/verification|verification.md]] | Verification commands for compose, metrics, Loki, Tempo, analytics, health. |
| [[07-docs/observability/ADMIN-METRICS-VERIFICATION|ADMIN-METRICS-VERIFICATION.md]] | Admin metrics/telemetry verification: no mock data, API checks, UI checklist. |

## APIs and contracts

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/analytics-api|analytics-api.md]] | Analytics gateway API: telemetry/services, metrics/kpis, caching, degraded behaviour. |
| [[07-docs/observability/data-contract|data-contract.md]] | Data contracts for observability pipelines. |
| [[07-docs/observability/logging-contract|logging-contract.md]] | Logging contract and conventions. |

## Strategy and quality

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/slos|slos.md]] | SLOs and error budgets (admin-api, workers, bot, node-agent). |
| [[07-docs/observability/coverage|coverage.md]] | Observability coverage checklist per component. |
| [[07-docs/observability/validation|validation.md]] | Validation approach for observability. |

## Logging

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/logging-architecture|logging-architecture.md]] | Logging architecture. |
| [[07-docs/observability/logging-standard|logging-standard.md]] | Logging standards and structure. |

## Folder structure

Key paths: `infra/monitoring/config/prometheus.yml`, `alert_rules.yml`, `infra/discovery/runtime/` (targets.json), `loki-config.yml`, `promtail-config.yml`, `tempo/`, `otel-collector/config.yaml`, `grafana/provisioning/` and `grafana/dashboards/`. Application metrics: `apps/admin-api/app/core/metrics.py`, `apps/telegram-bot/metrics.py`, `infra/monitoring/services/wg-exporter/wg_exporter.py`. Discovery: `infra/discovery/runtime/`. See [[07-docs/observability/current-state|current-state.md]] for full inventory.

## Live observability (SSE, real-time)

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/live-architecture|live-architecture.md]] | SSE metrics, Redis hot-state, Admin UI integration. |
| [[07-docs/observability/live-api|live-api.md]] | `GET /api/v1/live/metrics` SSE endpoint, event types, payloads. |
| [[07-docs/observability/live-storage|live-storage.md]] | Redis keys, TTLs, aggregator. |
| [[07-docs/observability/live-load-and-rollout|live-load-and-rollout.md]] | Load testing, rollout plan. |

## Other

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/archive-pipeline|archive-pipeline.md]] | Long-term archive pipeline (e.g. S3/GCS). |
| [[07-docs/observability/top-findings|top-findings.md]] | Top findings from observability review. |

## Service-specific

| Doc | Description |
|-----|-------------|
| [[07-docs/observability/services/admin-api|services/admin-api.md]] | admin-api instrumentation and metrics. |
| [[07-docs/observability/services/telegram-vpn-bot|services/telegram-vpn-bot.md]] | telegram-vpn-bot instrumentation. |
| [[07-docs/observability/services/node-agent|services/node-agent.md]] | node-agent metrics and scrape. |
| [[07-docs/observability/services/wg-exporter|services/wg-exporter.md]] | wg-exporter and WireGuard metrics. |
| [[07-docs/observability/services/amnezia-awg2|services/amnezia-awg2.md]] | amnezia-awg2 VPN server observability. |

---

## External documentation

For current configuration and API details, use official docs or Context7 with these library IDs:

| Stack | Official docs | Context7 library ID (for query-docs) |
|-------|---------------|--------------------------------------|
| Prometheus | https://prometheus.io/docs | `/prometheus/docs` |
| OpenTelemetry (Python) | https://opentelemetry-python.readthedocs.io | `/websites/opentelemetry-python_readthedocs_io_en_stable` |
| Grafana Tempo | https://grafana.com/docs/tempo | `/grafana/tempo` |
| Grafana Loki | https://grafana.com/docs/loki | `/grafana/loki` |
| Grafana | https://grafana.com/docs/grafana | `/grafana/grafana` |

**Prometheus:** Retention is set via `--storage.tsdb.retention.time=365d` (or equivalent in docker-compose).

**OpenTelemetry OTLP:** Configure `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. `http://otel-collector:4318` for HTTP/protobuf or `http://otel-collector:4317` for gRPC). Set `OTEL_EXPORTER_OTLP_PROTOCOL` to match (`http/protobuf` or `grpc`). Optional per-signal endpoints: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`.

**Tempo:** Block retention is configured in the compaction/overrides section (e.g. `block_retention`). See Tempo docs for `block_retention` and compaction.

**Loki / Grafana:** See the official docs for retention and provisioning.
