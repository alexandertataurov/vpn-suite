# Observability Health & Frontend Integration — Review

**Purpose:** Single reference for observability health signals and how the Admin frontend consumes them.

---

## 1. Observability Health (Backend)

### 1.1 Data sources

| Source | Health condition | When degraded |
|--------|------------------|----------------|
| **Prometheus** | `TELEMETRY_PROMETHEUS_URL` set and reachable | Unset, network error, or scrape failures |
| **Discovery** | discovery-runner writes `targets.json` | Stale/empty targets when discovery not running |
| **Loki** | Receiving logs from Promtail | N/A in Admin UI (Grafana only) |
| **Tempo** | OTLP receiving traces | N/A in Admin UI (Grafana only) |

### 1.2 Backend endpoints that reflect health

| Endpoint | Purpose | Degraded when |
|----------|---------|----------------|
| `GET /overview/health-snapshot` | Freshness + session/incident counts | DB/Redis down; no Prometheus → `metrics_freshness` still populated (telemetry/snapshots can be stale/missing) |
| `GET /overview/operator` | Operator dashboard (KPIs, matrix, timeseries) | `TELEMETRY_PROMETHEUS_URL` unset or Prometheus down → `data_status: "degraded"`, fallback data |
| `GET /analytics/telemetry/services` | Per-job scrape status (up/down, last scrape) | Prometheus unset → `prometheus_available: false`, `services: []` |
| `GET /analytics/metrics/kpis` | Request rate, error rate, p95 latency | Prometheus unset → `prometheus_available: false`, null KPIs |
| `GET /_debug/metrics-targets` | Raw Prometheus targets (debug) | 503 when Prometheus not configured |

**Caching:** Analytics endpoints use 30s TTL; health-snapshot is uncached (DB + optional Prometheus).

### 1.3 manage.sh and discovery

- **`./manage.sh up-monitoring`** starts: prometheus, cadvisor, node-exporter, loki, promtail, grafana, **discovery-runner**, wg-exporter, tempo, otel-collector.
- **Gap (historical):** docs/observability/gaps.md #1 said discovery-runner was not started; **current** [manage.sh](../../manage.sh) includes `discovery-runner` in the monitoring list — **fixed**.

---

## 2. Frontend Integration

### 2.1 Global (layout-level)

| Component | Data source | Health behavior |
|-----------|-------------|-----------------|
| **GlobalDataIndicator** | `GET /overview/health-snapshot` | Badge: "Fresh" / "Stale" / "Error"; shows "Metrics unavailable" when `metrics_freshness` indicates degraded/missing. Tooltip: "Prometheus/metrics unavailable or degraded". |

**Location:** [AdminLayout.tsx](../../apps/admin-web/src/layout/DashboardShell.tsx) — header area.

### 2.2 Telemetry page (`/telemetry`)

| Component | Data source | Health behavior |
|-----------|-------------|-----------------|
| **ScrapeStatusPanel** | `GET /analytics/telemetry/services` | Loading → skeleton. Error → InlineAlert "Failed to load scrape status". `prometheus_available: false` → InlineAlert "Prometheus not configured" + message. Else: "N up, M down" + badges per job. |
| **MetricsKpisPanel** | `GET /analytics/metrics/kpis` | Same pattern: loading/error/degraded (Prometheus not configured) or success (request rate, error rate, p95 latency). |
| **Refresh** | Refetches analytics keys + telemetry, topology, servers | Includes `ANALYTICS_TELEMETRY_SERVICES_KEY`, `ANALYTICS_METRICS_KPIS_KEY`. |

**Tabs:** Docker Services (optional; `DOCKER_TELEMETRY_HOSTS_JSON`), VPN Nodes (overview/operator + topology).

### 2.3 Operator dashboard (home / dashboard)

| Component | Data source | Health behavior |
|-----------|-------------|-----------------|
| **OperatorDashboardContent** | `GET /overview/operator?time_range=...` | Degraded banner when `data_status === "degraded"` — "Prometheus/telemetry is degraded. Showing fallback data." + link to `/telemetry`. Charts show stale/empty/error via ChartFrame. |
| **TopStatusBar / HealthStrip** | Same operator payload | `prometheus_status`, `api_status`, `freshness` drive score and labels (e.g. "Prom: OK"). |

### 2.4 Other surfaces

- **Servers table:** Telemetry column uses `/servers/telemetry/summary` and snapshot data; not driven by Prometheus directly.
- **Server drawer:** `/servers/:id/telemetry` for per-server telemetry.
- **/_debug/metrics-targets:** Not linked from UI (optional per plan); auth-protected, returns raw targets.

### 2.5 Frontend telemetry/metrics endpoints (single reference)

`GET /api/v1/dashboard/operator` was removed; use `GET /api/v1/overview/operator` only.

| API path | Query key | Component | Type |
|----------|-----------|-----------|------|
| `GET /overview/health-snapshot` | overview/health-snapshot | GlobalDataIndicator | health |
| `GET /overview/operator` | OPERATOR_DASHBOARD_KEY | OperatorDashboardContent, VpnNodesTab, TopStatusBar | telemetry / KPIs; primary timeseries for UI |
| `GET /overview/connection_nodes` | CONNECTION_NODES_KEY | ConnectionNodesSection | topology |
| `GET /analytics/telemetry/services` | ANALYTICS_TELEMETRY_SERVICES_KEY | ScrapeStatusPanel | scrape status |
| `GET /analytics/metrics/kpis` | ANALYTICS_METRICS_KPIS_KEY | MetricsKpisPanel | metrics KPIs |
| `GET /telemetry/snapshot` | TELEMETRY_SNAPSHOT_KEY | TelemetryHealthWidget | cache-only snapshot (meta, nodes.summary) |
| `GET /servers/telemetry/summary` | (servers list + summary) | useServersTelemetrySummary, Servers table | telemetry summary |
| `GET /servers/snapshots/summary` | SERVERS_SNAPSHOTS_SUMMARY_KEY | useServersSnapshotSummary | snapshots |
| `GET /servers/:id/telemetry` | serverTelemetryKey(id) | ServerRowDrawer, ServerDetail, VpnNodesTab | per-server telemetry |
| `GET /telemetry/docker/hosts`, `/telemetry/docker/containers`, `/telemetry/docker/container/:id/metrics` | DOCKER_TELEMETRY_KEY | useDockerTelemetry (Docker tab) | Docker metrics |

---

## 3. End-to-end health flow

```
Prometheus (optional) ──► admin-api (PrometheusQueryService)
                                │
                                ├── /overview/operator     ──► Operator dashboard, VPN Nodes tab
                                ├── /overview/health-snapshot ──► GlobalDataIndicator
                                ├── /analytics/telemetry/services ──► ScrapeStatusPanel
                                └── /analytics/metrics/kpis ──► MetricsKpisPanel

When TELEMETRY_PROMETHEUS_URL unset:
  - operator: data_status "degraded", fallback data
  - health-snapshot: metrics_freshness still set (telemetry/snapshots may be stale/missing)
  - analytics/*: prometheus_available: false, empty or null data
  - Frontend: GlobalDataIndicator "Metrics unavailable"; ScrapeStatusPanel / MetricsKpisPanel show warning alert.
```

---

## 4. Gaps vs docs (current)

| Doc gap | Status |
|---------|--------|
| Scrape-status panel in Admin UI | Done — ScrapeStatusPanel |
| UI "metrics unavailable" when degraded | Done — GlobalDataIndicator + ScrapeStatusPanel + MetricsKpisPanel |
| KPIs in Admin UI | Done — MetricsKpisPanel |
| discovery-runner in up-monitoring | Done — manage.sh includes it |
| /_debug/metrics-targets in Admin UI | Optional; not implemented (link could be added to Telemetry or Settings) |
| TELEMETRY_PROMETHEUS_URL empty by default | By design; UI degrades gracefully |

---

## 5. Recommendations

1. **Production:** Set `TELEMETRY_PROMETHEUS_URL` when running the monitoring stack so ScrapeStatusPanel, MetricsKpisPanel, and operator dashboard show live data.
2. **Verification:** After `./manage.sh up-monitoring`, open `/telemetry` — Scrape status and Metrics KPIs should show targets and numbers if Prometheus is scraping.
3. **Optional:** Add a "Debug: raw targets" link on the Telemetry page (e.g. to `/_debug/metrics-targets` in new tab or copy URL) for ops debugging.
4. **Alerts:** PrometheusTargetDown and other rules in [config/monitoring/alerts/unified-alerts.yml](../../config/monitoring/alerts/unified-alerts.yml) are evaluated by Prometheus; ensure Alertmanager is configured if you want notifications.

---

## 6. File reference

| Area | Files |
|------|-------|
| Backend analytics | [analytics.py](../../apps/admin-api/app/api/v1/analytics.py) |
| Backend overview | [overview.py](../../apps/admin-api/app/api/v1/overview.py) |
| Frontend Telemetry page | [TelemetryPage.tsx](../../apps/admin-web/src/features/telemetry/TelemetryPage.tsx) |
| Frontend API client | [client.ts](../../apps/admin-web/src/core/api/client.ts) |
| Frontend query helper | [useApiQuery.ts](../../apps/admin-web/src/hooks/api/useApiQuery.ts) |
| Observability stack | [docs/release/observability-check.md](../release/observability-check.md) |
