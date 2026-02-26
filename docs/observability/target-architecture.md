# Observability — Target Architecture

**Phase 1 deliverable.** Consolidated observability pipeline for vpn-suite + amnezia-awg2. Designed for Docker Compose, multi-node VPN deployments, and a single stable Admin Dashboard API.

---

## 1. Components and Responsibilities


| Component            | Responsibility                                            | Ports                         | Notes                                                                         |
| -------------------- | --------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| **Prometheus**       | Scrape metrics, evaluate alerts, store TSDB               | 9090                          | Primary metrics store. Scrapes via file_sd targets.                           |
| **Alertmanager**     | Alert notifications                                        | 9093                          | Receives alerts from Prometheus; configure receivers per environment.         |
| **VictoriaMetrics**  | Long-term metrics storage (remote_write target)           | 8428                          | Receives remote_write from Prometheus; optional query source in Grafana.      |
| **Loki**             | Log aggregation, indexing, query                          | 3100                          | Existing. Receives from Promtail.                                             |
| **Promtail**         | Ship Docker container logs → Loki                         | 9080                          | Existing.                                                                     |
| **Tempo**            | Trace storage and query                                   | 3200 (HTTP), 4317 (OTLP gRPC) | New. Receives OTLP from OTEL Collector / instrumented services.               |
| **OTEL Collector**   | Receive OTLP (traces, optional logs), forward to backends | 4317 (gRPC), 4318 (HTTP)      | Optional. Unifies trace ingestion; metrics stay Prometheus-scraped (simpler). |
| **Grafana**          | Dashboards, datasource for Prometheus/Loki/Tempo          | 3000                          | Existing.                                                                     |
| **discovery-runner** | Populate file_sd targets.json for Prometheus              | —                             | Must be wired into manage.sh (see gaps).                                      |
| **wg-exporter**      | Expose WireGuard metrics via `wg show dump`               | 9586                          | Per VPN node (host-bound).                                                    |


**Metrics flow:** Services expose `/metrics` → Prometheus scrapes (file_sd) → Grafana / Admin API; Prometheus remote_write → VictoriaMetrics (long-term store).

**Logs flow:** Docker containers → Promtail → Loki → Grafana.

**Traces flow (current, optional):** admin-api, bot (OTLP) → OTEL Collector → Tempo → Grafana. Enabled when `OTEL_TRACES_ENDPOINT` is set; end-to-end validation still required.

---

## 2. Metrics Strategy

- **Storage:** Prometheus as primary; remote_write to VictoriaMetrics is configured in the monitoring profile for long-term retention. Mimir is still an optional future replacement.
- **Scraping:** Prometheus scrapes Prometheus-format endpoints. OTEL Collector does **not** scrape metrics—Prometheus scrape is simpler and already working (`[prometheus.yml](../../config/monitoring/prometheus.yml)`).
- **OTEL for metrics:** Deferred. Services use `prometheus_client`; adding OTLP metrics would require dual-write or migration. Documented as future work.

---

## 3. Traces Strategy

- **Backend:** Grafana Tempo (OTLP-native, Docker Compose–friendly).
- **Ingestion:** OTEL Collector receives OTLP gRPC/HTTP, exports to Tempo.
- **Instrumentation:** admin-api and telegram-vpn-bot use OpenTelemetry Python SDK; export OTLP to OTEL Collector when `OTEL_TRACES_ENDPOINT` is set. node-agent and wg-exporter stay metrics-only (no tracing).
- **Feasibility:** Python services can use `opentelemetry-instrumentation-fastapi`, `opentelemetry-exporter-otlp`. Caddy has no OTLP support—excluded from tracing.

---

## 4. Logs Strategy

- **Keep:** Loki + Promtail. Promtail scrapes `/var/lib/docker/containers/*/*-json.log` (`[promtail-config.yml](../../config/monitoring/promtail-config.yml)`).
- **OTEL logs:** Optional. OTEL Collector can receive OTLP logs and forward to Loki. Deferred until tracing is stable.

---

## 5. Multi-Node Support


| Node type               | Location          | Metrics source                          | Discovery                                                                               |
| ----------------------- | ----------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| Control plane           | vpn-suite compose | admin-api, bot, cadvisor, node-exporter | Static in targets.json (same host)                                                      |
| VPN node (amnezia-awg2) | Separate host     | wg-exporter, node-agent (if present)    | discovery-runner or manual targets; wg-exporter at `host.docker.internal:9586` per node |


- **wg-exporter:** Runs on each VPN node host. Prometheus reaches it via `host.docker.internal:9586` when control-plane and VPN node share a host, or via node IP/hostname in multi-host.
- **discovery-runner:** Writes targets.json for the control-plane host. For multi-node, extend discovery or use static config for remote wg-exporter endpoints.

---

## 6. Admin Dashboard API (Single Stable Surface)

Admin Dashboard **must not** scrape Prometheus from the browser. Backend exposes:


| Endpoint (conceptual)                  | Purpose                                                          | Backend                                                               |
| -------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /api/v1/overview/health-snapshot` | Telemetry freshness, incidents                                   | `[overview.py](../../backend/app/api/v1/overview.py)`                 |
| `GET /api/v1/overview/operator`        | Aggregated KPIs                                                  | PrometheusQueryService                                                |
| `GET /api/v1/_debug/metrics-targets`   | Scrape targets status                                            | PrometheusQueryService                                                |
| `GET /api/v1/telemetry/docker/`*       | Container metrics, logs (when `DOCKER_TELEMETRY_HOSTS_JSON` set) | `[telemetry_docker.py](../../backend/app/api/v1/telemetry_docker.py)` |


**Implemented (Phase 3):**

- `GET /api/v1/analytics/metrics/kpis` — normalized KPIs (request rate, error rate, p95 latency).
- `GET /api/v1/analytics/telemetry/services` — per-service up/down, last scrape.
- Caching for heavy Prometheus queries (30s TTL).
- Graceful degradation when `TELEMETRY_PROMETHEUS_URL` unset or Prometheus down.

---

## 7. Retention and Archive

**Target:** 365 days retention, then archive to cold storage.

| Data type | Retention | Archive after | Notes |
|-----------|-----------|---------------|-------|
| Metrics   | 365d      | 365d          | Prometheus: `--storage.tsdb.retention.time=365d`. Remote write to VictoriaMetrics is enabled in `prometheus.yml`. |
| Logs      | 365d      | 365d          | Loki `retention_period` (e.g. 8760h), compact to object storage |
| Traces    | 365d      | 365d          | Tempo: `block_retention` in compaction/overrides. Local or object-storage backend. |

**Archive:** See [archive-pipeline.md](archive-pipeline.md). Loki: S3 schema or sync job. Tempo: S3/GCS backend. Prometheus: document migration path (Thanos/VM/Mimir).

---

## 8. rx/tx Bytes: Counter Reset Limitation

**Limitation:** `wg show dump` reports cumulative rx/tx bytes **per interface session**. Values reset to 0 on:
- Container restart (amnezia-awg)
- Node reboot
- Interface reconfig

So we **cannot** derive a true "total bytes over 365 days" from raw `wireguard_received_bytes`/`wireguard_sent_bytes` alone — each restart starts a new counter from 0.

**Keeping continuous metrics:**

1. **Use `rate()` and `increase()`** — Prometheus/VictoriaMetrics detect counter resets and handle them correctly. `rate(wireguard_received_bytes[5m])` and `increase(wireguard_received_bytes[1d])` are accurate within each session.
2. **Frequent scrape** — Keep 15s scrape interval so we capture pre-reset and post-reset samples; `increase()` can then compute deltas correctly across restarts.
3. **Long-term store** — VictoriaMetrics or Mimir with 365d retention; both handle counter resets in `increase()` and `rate()`.
4. **Aggregate per peer over time** — For "total bytes per peer over 365 days", sum `increase(wireguard_received_bytes[1d])` over non-overlapping 1d windows (VictoriaMetrics `running_sum` or recording rules). Restarts create gaps; treat as "total since last reset" for the affected window.

**wg-exporter:** Exposes counters as `# TYPE wireguard_received_bytes counter` / `wireguard_sent_bytes counter` ([`wg_exporter.py`](../../monitoring/wg-exporter/wg_exporter.py)). Do **not** change to gauge — counters allow correct `rate()`/`increase()` semantics.

**Implementation:** For 365d metrics retention, set Prometheus `--storage.tsdb.retention.time=365d` and VictoriaMetrics `-retentionPeriod=365d` in the monitoring profile. For Loki: `retention_period: 8760h` (365 days) in config. For Tempo: `compactor.compaction.block_retention: 8760h`.

---

## 9. Naming Conventions


| Label / Attribute       | Meaning                                                          | Example                                                      |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `service_name`          | Prometheus service label (metrics)                               | `admin-api`, `telegram-vpn-bot`, `node-agent`, `wg-exporter` |
| `service.name`          | OpenTelemetry resource attribute (traces)                        | `admin-api`, `telegram-vpn-bot`                              |
| `env`                   | Deployment environment                                           | `production`, `staging`, `development`                       |
| `node_id`               | VPN node identifier (from `/etc/vpn-suite/node-id` or Server.id) | `vpn-node-1`                                                 |
| `instance`              | Scrape target (host:port)                                        | `admin-api:8000`                                             |
| `job`                   | Prometheus job name (maps to service)                            | `admin-api`, `wg-exporter`                                   |
| `version` / `build_sha` | Application version                                              | From `API_VERSION` or CI `GITHUB_SHA`                        |


**Application:** Prometheus uses `service_name` via relabels; OTEL uses `service.name` in tracing resources. Ensure `env` and `node_id` are consistently populated via relabels or exporter instrumentation.

---

## 10. Security Model


| Component                              | Auth                         | Exposure                                                                              |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| Prometheus                             | None (internal network)      | Binds 127.0.0.1:19090 on host (`[docker-compose.yml](../../docker-compose.yml)` L224) |
| Loki                                   | None                         | 127.0.0.1:3100                                                                        |
| Grafana                                | `GF_SECURITY_ADMIN_PASSWORD` | 127.0.0.1:3000                                                                        |
| OTEL Collector                          | None for OTLP (internal)     | Listen on container network only                                                      |
| Metrics endpoints (`/metrics`)         | None                         | Scraped from internal Docker network only                                             |
| Admin API (`TELEMETRY_PROMETHEUS_URL`) | Backend server-side only     | No browser CORS to Prometheus                                                         |


**Recommendation:** In production, put Grafana/Prometheus behind reverse proxy with auth. OTLP ingestion should be on internal network; optionally add API key for OTLP if collector is exposed.

---

## 11. Rollout Order

1. **Phase 2a:** Wire discovery-runner into manage.sh; ensure targets.json includes wg-exporter, node-agent.
2. **Phase 2b:** Add standard labels (`service.name`, `env`) to Prometheus relabel_configs.
3. **Phase 2c:** Verify OTEL Collector + Tempo and enable OTLP traces by setting `OTEL_TRACES_ENDPOINT` on admin-api/bot.
4. **Phase 3:** Implement Analytics Gateway endpoints; UI loading/error states.
5. **Phase 4:** Legacy cleanup after parity verified.
