## Live observability storage – Redis hot state

### 1. Key schema

All keys share the `live:` prefix to keep the namespace narrow and easy to purge.

- `live:nodes:state`
  - Type: string (JSON-encoded `ClusterLiveSnapshot`).
  - TTL: 30s.
  - Written by: `app.live_metrics.aggregator_worker.run_live_metrics_aggregator`.
  - Read by: `app.api.v1.live_metrics.live_metrics_stream`.

- `live:meta:degradation_mode`
  - Type: string.
  - TTL: none (explicitly updated).
  - Values: `"normal"`, `"degraded"`, `"tier1_slow"`, `"tier2_paused"`, `"circuit_open"`, etc.
  - Written by: aggregator based on snapshot freshness and upstream health.
  - Read by: SSE endpoint to choose effective interval and event semantics.

### 2. Cluster snapshot shape

- The value stored at `live:nodes:state` is a JSON object:

```json
{
  "ts": 1710000000,
  "updated_at": "2024-03-09T12:00:00Z",
  "summary": {
    "total_nodes": 10,
    "online_nodes": 9,
    "degraded_nodes": 1,
    "down_nodes": 0,
    "total_peers": 540,
    "total_rx_bytes": 123456789,
    "total_tx_bytes": 987654321,
    "stale_nodes": 0
  },
  "nodes": {
    "node-1": {
      "node_id": "node-1",
      "name": "amnezia-awg1",
      "region": "eu-central",
      "status": "ok",
      "heartbeat_age_s": 1.2,
      "peer_count": 80,
      "rx_bytes": 123456,
      "tx_bytes": 654321,
      "cpu_pct": null,
      "ram_pct": null,
      "stale": false,
      "incident_flags": []
    }
  },
  "mode": "normal",
  "degradation_reason": null
}
```

- CPU/RAM fields are populated when upstream telemetry contains them; otherwise they remain `null`.

### 3. Hot vs cold data

- **Hot state (Redis `live:*` + existing telemetry keys):**
  - Last-known node status, peer counts, and traffic.
  - Small, fixed-size payload optimized for 1s fanout and fast reconnect.
  - TTL ensures that if the aggregator or telemetry loops stall, the live pipeline quickly enters degraded mode instead of serving stale data indefinitely.

- **Cold/historical state (Prometheus + snapshot cache):**
  - Full operator dashboard metrics (`/overview/operator`, `/analytics/metrics/kpis`) and historical time series.
  - Snapshot cache (`snapshot_*` keys) remains the fan-in layer for per-node and per-device views and is read by the aggregator worker.

### 4. Size and safety limits

- Snapshot is bounded by:
  - At most one JSON object per node, no per-metric keys.
  - Payload cap enforced at SSE layer (`live_obs_max_event_bytes`, default 64KB); oversized patches are dropped and counted via `live_dropped_updates_total`.
- The aggregator avoids Prometheus/DB calls:
  - It reads only from Redis-backed snapshot/telemetry keys, so 1s aggregation does not hammer primary data stores.

