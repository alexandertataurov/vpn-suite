# Admin metrics and telemetry verification

Check that the admin UI at `/admin` shows only **real** metrics and telemetry (no mock or fake data). All production data comes from DB, Redis, Prometheus, or Docker API.

## Automated API checks

Run the verification script (requires admin JWT or login credentials):

```bash
# With login (default: admin@example.com / admin)
BASE_URL=http://127.0.0.1:8000 ./scripts/verify-admin-metrics.sh

# With existing JWT
TOKEN=<jwt> BASE_URL=https://vpn.vega.llc ./scripts/verify-admin-metrics.sh

# With custom credentials
ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE_URL=https://vpn.vega.llc ./scripts/verify-admin-metrics.sh
```

The script asserts:

- `GET /api/v1/overview/health-snapshot` — `metrics_freshness` present (real or missing/stale).
- `GET /api/v1/analytics/telemetry/services` — `prometheus_available` bool; `services` list when Prometheus is on (no fake targets).
- `GET /api/v1/analytics/metrics/kpis` — when `prometheus_available` is false, KPIs are null (no fabricated numbers).
- `GET /api/v1/overview/operator?time_range=1h` — `timeseries` is a list (from Redis / real telemetry).
- `GET /api/v1/overview/connection_nodes` — `nodes` is a list (from DB).

## Environment

- **TELEMETRY_PROMETHEUS_URL** — Must be set for Scrape status and Metrics KPIs to show real data. When unset, the UI shows "Prometheus not configured" and no fake numbers.
- **node_telemetry_interval_seconds** — > 0 and Redis available so dashboard timeseries and health-snapshot freshness are populated from real node polls.

## UI checklist (manual)

1. **Dashboard** — Connection nodes and operator blocks match server/peer data; operator timeseries matches Redis or is empty when no telemetry.
2. **Telemetry** — Scrape status and Metrics KPIs show real values when Prometheus is configured, or explicit "not configured" / nulls; Docker tab shows real containers or empty/error.
3. **Servers** — Server list and server detail telemetry match API responses; no placeholder numbers.

## Data sources (reference)

| UI | Backend |
|----|--------|
| GlobalDataIndicator | GET /overview/health-snapshot (DB, Redis) |
| ScrapeStatusPanel | GET /analytics/telemetry/services (Prometheus targets) |
| MetricsKpisPanel | GET /analytics/metrics/kpis (Prometheus queries) |
| Telemetry → Docker | DockerTelemetryService (Prometheus + Docker API) |
| Telemetry → VPN nodes | GET /overview/operator, /control-plane/topology/summary, /servers |
| Operator dashboard | GET /overview/operator (DB, Redis, Prometheus) |
| Connection nodes | GET /overview/connection_nodes (DB) |
| Servers list/detail | GET /servers, /servers/telemetry/summary, /servers/{id}/telemetry |

No mock or fake data is used in production code paths; mocks exist only in Storybook and E2E tests.

---

## Header badge vs health strip (clarification)

- **Header badge** ("Metrics stale or missing" / "Fresh" / "Stale" / "Error"): From `GET /overview/health-snapshot` → `metrics_freshness`. Reflects **data freshness** (telemetry last seen, snapshot last success). "Metrics stale or missing" means at least one of telemetry/snapshots/sessions/incidents is stale, missing, or degraded — not that Prometheus is down.
- **Health strip "Prom" (PROM OK)**: From `GET /overview/operator` → `health_strip.prometheus_status`. Reflects **Prometheus scrape/connectivity** (e.g. `up{job="admin-api"}`). So you can have PROM OK while the header shows "Metrics stale or missing" if telemetry or snapshot data is old.

Tooltip on the header badge explains this. No mock data in either source.

---

## When CPU %, RAM %, or Traffic & load show no data

- **Cluster matrix CPU % / RAM %**: Sourced from Prometheus (`vpn_node_cpu_utilization`, `vpn_node_memory_utilization`) with DB snapshot fallback. Backend now computes **region averages** from per-server values when present. "No data" appears when no server in that region has CPU/RAM metrics (Prometheus not exposing them or scrape not configured for that job).
- **Traffic & load chart**: Sourced from Redis `dashboard:timeseries:cluster` (written by the telemetry polling task from node peer/traffic data). Empty when polling is disabled, Redis is unavailable, or no nodes have reported telemetry yet.
- **User sessions**: From `GET /api/v1/peers?status=active`. Retries and a longer client timeout (30s) and loading threshold (55s) reduce spurious "request did not complete" on slow links.
