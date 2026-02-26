# Observability — Docs Index

Index of observability documentation for vpn-suite. For up-to-date external references, see [External documentation](#external-documentation) below.

## Core docs

| Doc | Description |
|-----|-------------|
| [current-state.md](current-state.md) | Service discovery inventory and dataflow. |
| [gaps.md](gaps.md) | Gap analysis: critical gaps, labels, silent failures. |
| [target-architecture.md](target-architecture.md) | Target architecture: Prometheus, Loki, Tempo, OTEL Collector, retention. |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Master implementation plan and task status. |
| [OBSERVABILITY-HEALTH-AND-FRONTEND-REVIEW.md](OBSERVABILITY-HEALTH-AND-FRONTEND-REVIEW.md) | Observability health signals and Admin frontend integration. |

## Runbooks and verification

| Doc | Description |
|-----|-------------|
| [runbook-observability.md](runbook-observability.md) | Deploy, debug, rollback, and security for the observability stack. |
| [verification.md](verification.md) | Verification commands for compose, metrics, Loki, Tempo, analytics, health. |
| [ADMIN-METRICS-VERIFICATION.md](ADMIN-METRICS-VERIFICATION.md) | Admin metrics/telemetry verification: no mock data, API checks, UI checklist. |

## APIs and contracts

| Doc | Description |
|-----|-------------|
| [analytics-api.md](analytics-api.md) | Analytics gateway API: telemetry/services, metrics/kpis, caching, degraded behaviour. |
| [data-contract.md](data-contract.md) | Data contracts for observability pipelines. |
| [logging-contract.md](logging-contract.md) | Logging contract and conventions. |

## Strategy and quality

| Doc | Description |
|-----|-------------|
| [slos.md](slos.md) | SLOs and error budgets (admin-api, workers, bot, node-agent). |
| [coverage.md](coverage.md) | Observability coverage checklist per component. |
| [validation.md](validation.md) | Validation approach for observability. |

## Logging

| Doc | Description |
|-----|-------------|
| [logging-architecture.md](logging-architecture.md) | Logging architecture. |
| [logging-standard.md](logging-standard.md) | Logging standards and structure. |

## Other

| Doc | Description |
|-----|-------------|
| [archive-pipeline.md](archive-pipeline.md) | Long-term archive pipeline (e.g. S3/GCS). |
| [legacy-removal-plan.md](legacy-removal-plan.md) | Legacy observability removal plan. |
| [top-findings.md](top-findings.md) | Top findings from observability review. |
| [diagnostics-upgrade-report.md](diagnostics-upgrade-report.md) | Diagnostics and upgrade report. |

## Service-specific

| Doc | Description |
|-----|-------------|
| [services/admin-api.md](services/admin-api.md) | admin-api instrumentation and metrics. |
| [services/telegram-vpn-bot.md](services/telegram-vpn-bot.md) | telegram-vpn-bot instrumentation. |
| [services/node-agent.md](services/node-agent.md) | node-agent metrics and scrape. |
| [services/wg-exporter.md](services/wg-exporter.md) | wg-exporter and WireGuard metrics. |
| [services/amnezia-awg2.md](services/amnezia-awg2.md) | amnezia-awg2 VPN server observability. |

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
