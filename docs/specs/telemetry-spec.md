# Telemetry spec: metric → source → refresh → UI

Mapping of metrics to data source, refresh strategy, and UI placement in the admin panel.

## Metric → source → refresh → UI

| Metric | Source | Refresh | UI placement |
|--------|--------|---------|--------------|
| Server heartbeat (last seen) | Agent heartbeat / Redis; DB `last_seen_at` | Sync loop + API | Servers list (ServerRow), Server detail header |
| CPU / RAM / Disk / Net | Prometheus or agent telemetry | GET `/servers/{id}/telemetry`; dashboard timeseries | Server detail Telemetry tab; Dashboard (MetricTile or chart) |
| Container status + restart count | Docker / telemetry_docker API | GET `/containers`, `/container/{id}/metrics` | Telemetry → DockerServicesTab, ContainerDetailsPanel |
| WG/AWG: peer count, rx/tx totals, handshake | Agent v1 telemetry / Prometheus `vpn_node_peers`, `vpn_node_health` | GET `/servers/telemetry/summary`, `/servers/{id}/telemetry` | Servers list (row), Server detail Overview (MetricTiles + peers Table) |
| Per-peer: last handshake, rx/tx, status | GET `/servers/{id}/peers` | On demand + polling | Server detail Peers table |
| Alerts (offline, crash, handshake collapse, disk, cert) | Prometheus/Loki alerts, GET `/alerts` (telemetry_docker), cert-status | Polling / SSE if added | AlertsPanel; Server detail mTLS block |

## Refresh strategy

- **Servers list and summary:** Existing `useServersTelemetrySummary` + `useServersStream` or polling. No breaking API changes.
- **Server detail:** `useQuery` for telemetry and peers with `staleTime` 30–60s.
- **Dashboard:** `useQuery` for overview and dashboard_timeseries with `staleTime` / `refetchInterval` as configured.

## UI components

- **MetricTile:** Used for scalar metrics (Peers, Online, RX/TX, handshake, etc.) on Dashboard and Server detail Overview.
- **TimeSeriesPanel:** Used for all time-series chart panels (CPU, RAM, Traffic, Handshake, Bandwidth, Active connections) with consistent loading/empty/error states.
- **ChartFrame:** Wraps chart content (e.g. EChart) with height and aria-label; used inside TimeSeriesPanel when showing chart.
