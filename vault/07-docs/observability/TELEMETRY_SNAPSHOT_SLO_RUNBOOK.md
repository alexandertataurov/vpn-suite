# Telemetry snapshot SLO runbook

## Targets

- **GET /telemetry/snapshot** (cached): P50 < 50ms, P95 < 200ms.
- **Critical signal freshness**: node/device snapshot reflect changes within 2s (P95), driven by telemetry poll + aggregator.
- **GET /overview/operator**: Uses snapshot cache first; P95 acceptable < 2s with warm cache.

## Metrics

- `telemetry_snapshot_request_duration_seconds` — histogram for snapshot API latency.
- `overview_operator_latency_seconds` — operator dashboard latency.
- `telemetry_poll_duration_seconds` — aggregator/poll loop duration.
- `telemetry_poll_runs_total{status="ok|error|skipped"}` — poll health.

## Load test (k6)

```bash
# Get JWT (e.g. login once and copy token)
TOKEN="<admin_jwt>"
BASE_URL="http://localhost:8000"

k6 run -e BASE_URL=$BASE_URL -e TOKEN=$TOKEN scripts/telemetry-snapshot-k6.js
```

Scenarios: cold snapshot (1 iter), warm snapshot (3 VUs, 20s), warm operator (2 VUs, 20s). Threshold: p95 < 2000ms (relaxed for CI; tighten to 200ms for snapshot in production).

## Cold cache

After restart or Redis flush, first snapshot request may hit empty cache; response still 200 with `meta.freshness: "stale"` or partial data. Next poll cycle fills cache.

## Partial node failures

Aggregator marks failed nodes in `meta.stale_node_ids` and `meta.partial_failure`. Dashboard returns last snapshot; no 503. Check `telemetry_poll_server_failures_total` and `telemetry_poll_last_success_timestamp` per server.

## Backpressure

Snapshot API is read-only from Redis; no fan-out to nodes. Under load, return cached data (possibly stale). If Redis is slow, consider `telemetry_snapshot_request_duration_seconds` p99 and alert above 500ms.
