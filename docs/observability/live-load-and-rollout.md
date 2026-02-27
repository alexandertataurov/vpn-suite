## Live observability – load test and rollout plan

### 1. Load test scenarios

#### 1.1 Nodes and telemetry

- **Goal:** validate that the live pipeline remains stable with at least **50 nodes**.
- Approach:
  - Use existing telemetry polling + snapshot pipeline:
    - Ensure `node_telemetry_interval_seconds` is tuned to a realistic production value.
  - If real nodes are unavailable, add a small worker or script that:
    - Writes synthetic `telemetry:server:{id}` keys and snapshot payloads into Redis for 50 fake node IDs.
    - Runs at the same cadence as `run_telemetry_poll_loop`.
  - Enable `LIVE_OBS_ENABLED=true` (env) on admin-worker and `VITE_LIVE_OBS_ENABLED=1` on admin-frontend.
  - Verify:
    - `live_node_staleness_seconds` histogram: most samples for active nodes remain under 5s.
    - `live_queue_depth` stays at 0 (aggregator not falling behind).

#### 1.2 Dashboards / SSE connections

- **Goal:** sustain **500 concurrent admin dashboards** connected to `/api/v1/live/metrics`.
- Tooling:
  - Use k6 or a similar HTTP load tool capable of:
    - Making long-lived GET requests.
    - Reading response bodies as streams (SSE).
  - Example outline with k6 (pseudo-code):
    - Authenticate once to obtain a valid JWT for an admin user.
    - Use that token in `Authorization` header for all virtual users.
    - Each VU opens `GET /api/v1/live/metrics?min_interval_ms=1000` and keeps it open for the duration.
    - Optionally parse a small number of SSE frames to ensure they are delivered.
  - Metrics to watch:
    - `live_connections` – should plateau around 500.
    - `live_fanout_latency_seconds` – p95 ≤ 0.5s under load.
    - `live_dropped_updates_total` – should remain low; spikes indicate payload/backpressure issues.
    - Admin worker/API CPU and memory usage.

#### 1.3 Reconnect storm

- **Goal:** ensure reconnect storms do not overload admin-api.
- Scenario:
  - With 200–500 live connections, simulate:
    - All clients closing and reconnecting within a short window (e.g. 5–10s), or
    - Rolling restarts of the admin-api pods.
  - In k6 or a custom script:
    - Each VU randomly chooses a time window to drop its SSE connection and reconnect with exponential backoff (+ jitter).
  - Expectations:
    - Admin-api should enforce the `live_obs_sse_max_connections` cap.
    - `live_reconnect_rate` should show a spike but remain within acceptable limits.
    - No sustained 5xx rates or saturation of CPU.

### 2. Rollout and feature flagging

#### 2.1 Flags and toggles

- Backend:
  - `LIVE_OBS_ENABLED=true` → enables live aggregator in the background worker and SSE router.
  - `live_obs_agg_interval_seconds`, `live_obs_sse_max_connections`, `live_obs_max_event_bytes` control cadence and capacity.
- Frontend:
  - `VITE_LIVE_OBS_ENABLED=1` → enables `LiveMetricsProvider` and UI wiring.
  - When unset, UI falls back to existing REST/Prometheus-based polling only.

#### 2.2 Rollout phases

1. **Dark launch**
   - Enable `LIVE_OBS_ENABLED=true` in admin-worker only; keep `VITE_LIVE_OBS_ENABLED` unset.
   - Verify via:
     - Prometheus metrics (`live_*` series) on the admin-worker/API.
     - Manual curls to `/api/v1/live/metrics` from an authenticated client.

2. **Canary – 5% admins**
   - Build a canary frontend with `VITE_LIVE_OBS_ENABLED=1` and ship it to a small subset of admins (e.g. separate hostname or feature-flag group).
   - Monitor:
     - `live_connections`, `live_fanout_latency_seconds`, `live_dropped_updates_total`, `live_reconnect_rate`.
     - Overall admin-api request latency and error rates.

3. **Gradual ramp**
   - Increase coverage to ~25%, then 50%, then 100% of admins.
   - After each step, re-run the key load test (at least 200–300 live SSE connections) and verify:
     - p95 fanout latency ≤ 500ms.
     - No regressions in CPU/memory or DB/Prometheus load.

4. **Kill switch**
   - Immediate disable:
     - Set `LIVE_OBS_ENABLED=false` (or omit) on admin-worker and restart → aggregator stops, `live:*` keys age out.
     - Rebuild or reconfigure the frontend without `VITE_LIVE_OBS_ENABLED` → `LiveMetricsProvider` becomes a no-op and all components use existing polling flows.
   - In incident response:
     - Disable frontend feature flag first (stops new SSE connections).
     - Then disable backend flag and recycle worker pods.

