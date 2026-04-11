# Analytics Gateway API

Stable endpoints for Admin Dashboard. Server-side queries to Prometheus; no browser CORS to Prometheus.

**Note:** `GET /api/v1/dashboard/operator` was removed; use `GET /api/v1/overview/operator` for operator dashboard data.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/analytics/telemetry/services` | Per-service scrape status (up/down, lastScrape) |
| GET | `/api/v1/overview/health-snapshot` | Telemetry freshness, incidents, sessions |
| GET | `/api/v1/overview/operator` | Operator dashboard (KPIs, cluster matrix, timeseries); primary timeseries source for UI |
| GET | `/api/v1/analytics/metrics/kpis` | Aggregated KPIs: request rate, error rate, p95 latency |
| GET | `/api/v1/telemetry/snapshot` | Cache-only telemetry snapshot (meta, nodes.summary); TelemetryHealthWidget |
| GET | `/api/v1/servers/:id/telemetry` | Per-server telemetry; frontend uses query key `serverTelemetryKey(id)` |
| GET | `/api/v1/_debug/metrics-targets` | Raw Prometheus targets (debug) |

## Response: `/api/v1/analytics/telemetry/services`

```json
{
  "services": [
    {
      "job": "admin-api",
      "instance": "admin-api:8000",
      "health": "up",
      "last_scrape": "2025-02-24T12:00:00Z",
      "last_error": null
    }
  ],
  "prometheus_available": true,
  "message": null
}
```

When Prometheus is unavailable:

```json
{
  "services": [],
  "prometheus_available": false,
  "message": "Prometheus not configured (TELEMETRY_PROMETHEUS_URL unset)"
}
```

**Caching:** 30s TTL for targets response.

---

## Response: `/api/v1/analytics/metrics/kpis`

Aggregated KPIs from Prometheus (request rate over 5m, 5xx error rate, p95 latency). Cached 30s. Requires cluster-read permission.

**Success (Prometheus available):**

```json
{
  "request_rate_5m": 1.5,
  "error_rate_5m": 0.01,
  "latency_p95_seconds": 0.12
}
```

- `request_rate_5m`: requests/sec (5m rate).
- `error_rate_5m`: fraction of 5xx (0–1).
- `latency_p95_seconds`: 95th percentile request duration in seconds.

**Degraded (Prometheus unset or unreachable):**

```json
{
  "request_rate_5m": null,
  "error_rate_5m": null,
  "latency_p95_seconds": null
}
```

**Caching:** 30s TTL. On fetch failure, endpoint returns nulls (graceful degradation).
