# Telemetry Console Audit — Operator-Grade Hardening

**Target:** `/admin/telemetry` (React/Vite admin SPA)  
**Mission:** Detect/fix connection issues, ensure live data, surface staleness, add Data Source Health strip.

---

## 1. UI System Baseline (File Inventory)

| File | Role |
|------|------|
| `frontend/admin/src/features/telemetry/TelemetryPage.tsx` | Telemetry page (snapshot + docker tables + actions) |
| `frontend/admin/src/core/api/useApiQuery.ts` | React Query helper (`queryKey` is inline arrays) |
| `frontend/admin/src/core/api/client.ts` | Fetch-based API client (timeout + retry) |
| `frontend/admin/src/shared/types/admin-api.ts` | API response types (containers, alerts, servers, etc.) |

**Note (2026-03):** This audit was written against a pre-refactor admin layout (`pages/`, `hooks/`, `api/query-keys.ts`). The current implementation is consolidated under `features/` + `core/` and may not match the older file inventory above.

---

## 2. Baseline Findings (Connection Issues + Repro)

### Data flow summary

| Tab | Hooks / queries | Endpoints | Polling |
|-----|-----------------|-----------|---------|
| Docker | useDockerHosts, useDockerContainers, useContainerMetrics, useContainerLogs, useDockerAlerts | `/telemetry/docker/hosts`, `/containers`, `/container/{id}/metrics`, `/container/{id}/logs`, `/alerts` | 5–10s (hosts/containers), 2–5s (details) |
| VPN | useQuery topology, useServerListForRegion, useQuery server telemetry | `/control-plane/topology/summary`, `/servers`, `/servers/{id}/telemetry` | 5s (topology/telemetry), 10s (servers) |

### Endpoints (API base: `/api/v1`)

| Method | Path | Response schema | Timestamp field |
|--------|------|-----------------|-----------------|
| GET | `/telemetry/docker/hosts` | HostSummaryListOut | HostSummary.last_seen_at |
| GET | `/telemetry/docker/containers?host_id=` | ContainerSummaryListOut | ContainerSummary.started_at (no list-level ts) |
| GET | `/telemetry/docker/container/{id}/metrics?host_id=&range=&step=` | ContainerMetricsTimeseries | points[].ts |
| GET | `/telemetry/docker/container/{id}/logs` | ContainerLogLineListOut | items[].ts |
| GET | `/telemetry/docker/alerts?host_id=` | AlertItemListOut | items[].created_at |
| GET | `/control-plane/topology/summary` | TopologySummaryOut | timestamp |
| GET | `/servers?...` | ServerList | items[].last_seen_at |
| GET | `/servers/{id}/telemetry` | ServerTelemetryOut | last_updated |

### Suspected root causes

1. **Silent failures:** serverTelemetryQuery error in VpnNodesTab not surfaced → widget shows skeleton/empty; no banner.
2. **Stale cache:** React Query `staleTime` 2–5s; when backend 503, no exponential backoff → repeated 503 spam.
3. **No freshness badges:** Docker hosts/containers list has no "last_seen" badge; topology timestamp not shown.
4. **No manual refresh:** No page-level "Refresh now" button.
5. **Partial failures:** If topology OK but server telemetry fails, only PageError for summary/servers; server stream panel keeps last data without "stale" label.
6. **403/429:** Not explicitly handled (generic error message).

---

## 3. Telemetry Contract Map + Source Map

### ServerTelemetryOut (`backend/app/schemas/server.py`, `shared/types/admin-api.ts`)

```ts
interface ServerTelemetryOut {
  peers_count: number;
  online_count: number;
  total_rx_bytes?: number | null;
  total_tx_bytes?: number | null;
  last_updated?: string | null;  // ISO datetime
  source: "api" | "cache" | "agent";
  node_reachable?: boolean;
  container_name?: string | null;
  agent_version?: string | null;
  reported_status?: string | null;
}
```

### TopologySummaryOut

```ts
interface TopologySummaryOut {
  timestamp: string;  // ISO datetime
  nodes_total: number;
  healthy_nodes: number;
  degraded_nodes: number;
  unhealthy_nodes: number;
  // ...
}
```

### ContainerMetricsTimeseries

```ts
interface ContainerMetricsPoint { ts: string; cpu_pct?: number | null; ... }
interface ContainerMetricsTimeseries {
  host_id: string;
  container_id: string;
  from: string; to: string;
  step_seconds: number;
  points: ContainerMetricsPoint[];
}
```

### Source dependencies (from backend code)

| Endpoint | Backend dependency |
|----------|-------------------|
| `/telemetry/docker/*` | Docker API (DOCKER_TELEMETRY_HOSTS_JSON), optional Prometheus for alerts |
| `/control-plane/topology/summary` | TopologyEngine, node_runtime_adapter (Docker or agent) |
| `/servers/{id}/telemetry` | Redis (agent heartbeat), telemetry_polling_task (cache), node adapter |

---

## 4. Freshness Spec

### Thresholds (configurable constants)

| Status | Rule |
|--------|------|
| FRESH | lastSampleAge ≤ 30s |
| DEGRADED | 30s < age ≤ 2m |
| STALE | age > 2m or missing timestamp |
| PARTIAL | some series fresh, some stale (charts) |
| UNKNOWN | no timestamp in payload |

### Implementation

- **Docker metrics charts:** Already use `computeTimeseriesStatus` (stale: `now - lastTs > max(step*2, 20_000)`). Align with 30s/2m thresholds.
- **VPN server telemetry:** Use `last_updated`; `streamDelayed` currently >20s → align to DEGRADED 30s, STALE 2m.
- **Topology:** Use `timestamp` for summary freshness.
- **Docker hosts:** Use `last_seen_at` per host; list-level badge from most recent.

### UI requirements

- Global "Last updated" for page fetch.
- Per-widget badge: Fresh / Degraded / Stale / Partial / Unknown.
- Tooltip: last sample age + data source.
- If stale: CTA "Retry", last known value clearly labeled.

---

## 5. Error Taxonomy + UI States

| Error | UI behavior |
|-------|-------------|
| Offline (navigator.onLine) | Page banner: "You are offline" |
| Timeout / gateway / unreachable | Banner: "Data source unreachable" + Retry |
| 401 | Redirect to login (existing) |
| 403 | "Permission denied" + telemetry:read hint |
| 429 | "Rate limited" + cooldown if header present |
| 5xx | Banner + Retry |
| Partial (some widgets fail) | Widget error placeholder, keep last data as "stale" |

---

## 6. Live Refresh (Auto + Manual + Backoff)

### Current

- React Query `refetchInterval` via `refetchWhenVisible(ms)`.
- No manual "Refresh now".
- No error backoff.

### Target

- **Manual:** Page-level "Refresh now" button; per-widget optional.
- **Auto:** Keep refetchInterval; add `refetchOnWindowFocus: true` for telemetry queries.
- **Backoff:** On error, increase interval (e.g. 15s → 30s → 60s max); reset on success. Use `refetchInterval: (query) => ...` based on error count.

---

## 7. Data Source Health Strip

Add compact strip at top:

| Signal | Source |
|--------|--------|
| API status | Inferred from last request success (OK/Degraded/Down) |
| Last successful fetch | From query state `dataUpdatedAt` |
| Current refresh mode | "Polling" |
| Current interval | e.g. "15s" |
| Current time range | e.g. "Last 15m" (Docker) / "—" (VPN) |

Label as "inferred" when not from explicit health endpoint.

---

## 8. PR Plan

- **PR1:** Observability + error states + Data Source Health strip
- **PR2:** Freshness model + live refresh + backoff
- **PR3:** Performance fixes + tests + cleanup

---

## 9. Implementation Summary (Completed)

### Files changed/added

This section refers to a pre-refactor implementation. The current Telemetry UI entrypoint is:

- `frontend/admin/src/features/telemetry/TelemetryPage.tsx`

### Freshness thresholds

- FRESH: age ≤ 30s
- DEGRADED: 30s < age ≤ 2m
- STALE: age > 2m
- UNKNOWN: no timestamp

### Further improvements (round 2)

- ChartFrame: Retry button on metrics/logs error; 403/429/503-specific hint text
- getTelemetryErrorMessage: status-aware messages (403, 429, 503, TIMEOUT)
- VPN health strip: use topology.timestamp for "Last updated" when available
- ContainerDetailsPanel: onMetricsRetry, onLogsRetry wired to chart Retry

### Error backoff

- On repeated failures: interval = base × 2^min(failures, 4), capped at 60s
- Reset to base on success (failureCount → 0)
- Applied to: useDockerHosts, useDockerContainers, useContainerMetrics, useContainerLogs, useDockerAlerts; topology + server telemetry in VpnNodesTab
