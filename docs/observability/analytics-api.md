# Analytics Gateway API

Stable endpoints for Admin Dashboard. Server-side queries to Prometheus; no browser CORS to Prometheus.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/analytics/telemetry/services` | Per-service scrape status (up/down, lastScrape) |
| GET | `/api/v1/overview/health-snapshot` | Telemetry freshness, incidents, sessions |
| GET | `/api/v1/overview/operator` | Operator dashboard (KPIs, cluster matrix, timeseries) |
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
