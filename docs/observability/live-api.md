## Live observability API – vpn-suite

### 1. Streaming endpoint

- **Path:** `GET /api/v1/live/metrics`
- **Protocol:** Server-Sent Events (SSE) over HTTP(S)
- **Auth:** same JWT/session model and RBAC as other admin APIs
  - Requires `PERM_SERVERS_READ` (admin/operator roles).
  - Uses `Authorization: Bearer <access_token>` header.

#### Query parameters

- `min_interval_ms` (optional, default `1000`)
  - Client hint for minimum update cadence.
  - Server clamps to `[500ms, 10s]` and may slow down further in degraded modes.

#### Event types and payloads

- `snapshot`
  - Sent once on initial connect (when data is available) and occasionally when patches are too large.
  - Payload:
    - `ts: number` – snapshot timestamp (Unix seconds).
    - `summary: { total_nodes, online_nodes, degraded_nodes, down_nodes, total_peers, total_rx_bytes, total_tx_bytes, stale_nodes }`.
    - `nodes: { [node_id]: { node_id, name?, region?, status, heartbeat_age_s?, peer_count?, rx_bytes?, tx_bytes?, cpu_pct?, ram_pct?, stale?, incident_flags?[] } }`.
    - `mode: "normal" | "degraded" | "circuit_open"`.
    - `degradation_reason?: string`.

- `patch`
  - Incremental update: only nodes whose state changed since last snapshot/patch.
  - Payload:
    - `ts?: number` – last snapshot timestamp.
    - `summary?: { ... }` – replacement summary for cluster.
    - `nodes: { [node_id]: NodeLiveState }` – changed/added nodes only.
    - `mode?: string`.
    - `degradation_reason?: string`.

- `keepalive`
  - Sent when there are no node changes in a given interval.
  - Payload: `{ "ts": number }`.

- `degraded`
  - Emitted when live pipeline is degraded or circuit-open (e.g. Redis/agents unavailable, snapshot stale).
  - Payload:
    - `mode: "degraded" | "tier1_slow" | "tier2_paused" | "circuit_open"`.
    - `reason: "no_snapshot" | "snapshot_stale" | "internal_error" | string`.

#### Error behaviour

- When capacity limits are exceeded:
  - API returns `503 Service Unavailable` with message `"Live stream capacity exceeded"`.
- When auth fails:
  - Returns `401 Unauthorized` or `403 Forbidden` as appropriate.
- When Redis or the aggregator are unhealthy:
  - Stream emits `degraded` events, then may close with `503` depending on failure mode.

### 2. Degradation and backpressure

- Server-side caps:
  - `live_obs_sse_max_connections` (default 2000) – hard limit on concurrent SSE connections.
  - `live_obs_max_event_bytes` (default 64KB) – per-event payload cap; oversized patches are dropped and counted via `live_dropped_updates_total`.
- The aggregator writes cluster state to `live:nodes:state` at `live_obs_agg_interval_seconds` (default 1s).
- The SSE layer adapts its effective interval based on:
  - `min_interval_ms` hint from client.
  - Current `degradation_mode` stored in Redis (`live:meta:degradation_mode`).

### 3. Client usage (React admin)

- Use `VITE_LIVE_OBS_ENABLED=1` at build time to enable the live pipeline in the admin frontend.
- The admin app connects using a single stream per browser tab via `LiveMetricsProvider`, which:
  - Uses `fetch` streaming with `Authorization: Bearer <token>`.
  - Parses SSE events and applies patches via `liveMetricsStore`.
  - Throttles UI updates to at most 1 frame per second for heavy components.
- Hooks:
  - `useClusterLiveMetrics()` → latest `LiveClusterState | null`.
  - `useNodeLiveMetrics(nodeId)` → latest per-node view for details panels.

