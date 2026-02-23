# Admin Servers Page — Audit & Hardening

Operator-grade control plane for `/admin/servers`. Evidence-based, repo-referenced.

---

## 0) BASELINE FINDINGS

### Inventory of Relevant Files

| File | Role |
|------|------|
| `frontend/admin/src/pages/Servers.tsx` | Main page component |
| `frontend/admin/src/hooks/useServerList.ts` | Server list query (GET /servers) |
| `frontend/admin/src/hooks/useServersStream.ts` | SSE live updates (GET /servers/stream) |
| `frontend/admin/src/components/ServerRow.tsx` | Row with status, last_seen, last_snapshot staleness |
| `frontend/admin/src/components/ServerRowDrawer.tsx` | Row drawer |
| `frontend/admin/src/api/query-keys.ts` | SERVERS_LIST_KEY, etc. |
| `frontend/shared/src/types/admin-api.ts` | ServerOut, ServerList |
| `frontend/shared/src/api-client/create-client.ts` | api client (15s timeout, 401→onUnauthorized, retry 502/503) |
| `backend/app/api/v1/servers.py` | list_servers |
| `backend/app/api/v1/servers_stream.py` | GET /servers/stream (SSE) |
| `backend/app/api/v1/servers_crud.py` | GET/PATCH /servers/{id}, DELETE /servers/{id}/ips/{ip_id} |

### Data Flow

1. **Main list**: `useServerList` → `api.get("/servers?limit=…&offset=…")` → `SERVERS_LIST_KEY` (React Query)
2. **Live updates**: `useServersStream(true)` → raw `fetch("/servers/stream")` → merges `server.status` into cache via `queryClient.setQueryData`
3. **Polling fallback**: when `connectionState === "degraded"`, `useEffect` runs `refetchQueries` every 30s
4. **Telemetry**: `useServersTelemetrySummary` → `/servers/telemetry/summary`, `useServersSnapshotSummary` → `/servers/snapshots/summary`
5. **Device counts**: `serversDeviceCountsKey` → `/servers/device-counts` (404 → skip)

### Endpoints Used

| Method | Path | Source |
|--------|------|--------|
| GET | /api/v1/servers | useServerList.ts:68, 84, 156 |
| GET | /api/v1/servers/stream | useServersStream.ts:123 |
| GET | /api/v1/servers/telemetry/summary | useServerList.ts:178 |
| GET | /api/v1/servers/snapshots/summary | useServerList.ts:187 |
| GET | /api/v1/servers/device-counts | Servers.tsx:242 |
| POST | /api/v1/servers/{id}/restart | Servers.tsx:296 |
| POST | /api/v1/servers/{id}/sync | Servers.tsx:317, 399 |
| POST | /api/v1/servers/{id}/actions | Servers.tsx:338 |
| PATCH | /api/v1/servers/bulk | Servers.tsx:360 |

### Connection Issues Identified

| Issue | Location | Root Cause |
|-------|----------|------------|
| useServersStream uses raw fetch | useServersStream.ts:129 | No timeout, no 401 handling (token in header only) |
| 404 on stream → sessionStorage skip | useServersStream.ts:135–137 | Silent 404; retry clears it |
| useServerList has no refetchInterval | useServerList.ts:165 | staleTime 60s; no auto-refresh when stream is offline |
| device-counts 404 → silent fallback | Servers.tsx:244–254 | sessionStorage skip, returns empty counts |
| No "Last updated" timestamp | Servers.tsx | Page shows connectionState badge but no data fetch time |

### Suspected Root Causes

1. **Stale cache masking failures**: `staleTime: 60_000`; if GET /servers fails, React Query may serve cached data without clear "stale" label
2. **Stream 404**: Backend may not expose /servers/stream in some deployments → degraded mode, 30s polling
3. **No DELETE server endpoint**: `servers_crud.py` has no DELETE /servers/{id}; only DELETE /servers/{id}/ips/{ip_id}

---

## 1) FRESHNESS SPEC

### Liveness Fields (from API)

| Field | Type | Source | Used For |
|-------|------|--------|----------|
| `last_seen_at` | ISO string \| null | ServerHealthLog.ts | Heartbeat/agent liveness |
| `last_snapshot_at` | ISO string \| null | Server model | Snapshot sync time |
| `status` | enum | Server model | online/offline/degraded/unknown |

### Freshness Rule (configurable)

- **FRESH**: `lastUpdate <= 30s` (or `last_seen_at` / `last_snapshot_at` within 30s)
- **DEGRADED**: `30s < lastUpdate <= 2m`
- **STALE**: `> 2m` or null/unknown
- **Unknown**: no timestamp from API → label "Unknown freshness"

### Implementation Points

- `ServerRow.tsx`: `isStale(iso)` → 90s (last_seen), `isSnapshotStale(iso)` → 10min default
- `Servers.tsx`: `serverNeedsAttention()` uses both for "Needs attention" filter
- **Constants** (centralize): `FRESH_MS=30_000`, `DEGRADED_MS=120_000`, `STALE_MS` (or use existing 90_000/600_000)

### Deliverable

- `frontend/admin/src/constants/freshness.ts`: `FRESH_MS`, `DEGRADED_MS`, `getFreshnessLevel(iso)` → "fresh" | "degraded" | "stale" | "unknown"
- ServerRow + page use `getFreshnessLevel` for badge/tooltip

---

## 2) LIVE UPDATES: AUTO + MANUAL SYNC

### Current

- useServersStream: SSE, no refetchInterval on GET /servers
- Degraded: 30s polling via `refetchQueries`
- useServerList: `staleTime: 60_000`, no `refetchInterval`

### Target

- **useServerList**: add `refetchInterval: refetchWhenVisible(15_000)` (15s when page visible)
- **Manual Sync**: "Sync now" button → `refetch()` → disable while `isFetching`, show result toast
- **Last updated**: `dataUpdatedAt` from React Query → "Last updated: HH:MM:SS"
- **Per-row**: keep existing "stale" badge (ServerRow L161–165, L184–188)
- **Stream**: add `AbortController` + timeout (e.g. 60s) to raw fetch; reconnect on error

### UI Requirements (implemented)

- Global "Last updated: HH:MM:SS"
- Per-row Fresh/Degraded/Stale/Unknown (via existing + getFreshnessLevel)
- "Sync now" button: disables while syncing, shows result + timestamp

---

## 3) CONNECTION & ERROR TAXONOMY

| Error | Condition | UI |
|-------|-----------|-----|
| Offline | `navigator.onLine === false` | InlineAlert "You are offline" |
| API unreachable | fetch throws / network error | PageError + Retry |
| Timeout | AbortError (api client 15s) | PageError "Request timed out" |
| 401 | onUnauthorized → redirect/login | Already handled in api client |
| 403 | statusCode 403 | InlineAlert "Permission denied" |
| 5xx | statusCode >= 500 | PageError + requestId |
| Empty | data?.items?.length === 0 | EmptyState (existing) |
| Loading | isLoading | TableSkeleton (existing) |
| Partial | some rows stale | Row-level badge (existing) |
| Hard failure | error + no cache | PageError (existing) |

### Logging

- Structured: `{ event, endpoint, status, requestId }` — avoid tokens
- Use existing `logFrontendError` for critical errors

---

## 4) DELETE SERVER

### Discovery

- **No** `DELETE /api/v1/servers/{id}` endpoint exists. Only `DELETE /api/v1/servers/{id}/ips/{ip_id}`.
- `devices.server_id` has `ondelete="RESTRICT"` → deletion fails if devices reference server.

### Implementation

1. **Backend** (`servers_crud.py`): Add `DELETE /{server_id}`:
   - `require_permission(PERM_SERVERS_WRITE)`
   - Check device count; if > 0 return 409 "Cannot delete server with active devices"
   - `db.delete(server)`; commit; `invalidate_servers_list_cache()`
2. **Frontend**:
   - API: `api.request(`/servers/${id}`, { method: "DELETE" })`
   - Row DropdownMenu: "Delete…" (danger)
   - ConfirmDanger: server name/id/IP, type server name to confirm
   - On success: invalidate SERVERS_LIST_KEY, toast, close drawer
   - On 409: show "Move or revoke devices first"

---

## 5) "LIVE AND UP TO DATE" GUARANTEE

- Never display stale data as live → use freshness badges
- Unknown freshness → "Unknown"
- Metric older than threshold → gray + "stale" badge
- Data source status: API OK/Degraded/Down (from connectionState + refetch status)

---

## 6) PERFORMANCE & OPERATOR UX

- Memoize ServerRow (React.memo) — reduce re-renders
- Stable keys: `server.id`
- Virtualize >200 rows (existing)
- Right-align numeric columns (existing `table-cell-numeric`)
- Truncate long strings with tooltips (audit per cell)

---

## 7) PR PLAN

| PR | Scope | Status |
|----|-------|--------|
| PR1 | Observability: error taxonomy, offline check, "Last updated", Sync now button | Done |
| PR2 | Freshness: constants, getFreshnessLevel, refetchInterval, stream timeout | Done |
| PR3 | Delete server: backend DELETE /servers/{id} + frontend (ConfirmDanger, memo) | Done |

## 8) IMPLEMENTATION SUMMARY

### Files changed

| File | Change |
|------|--------|
| `frontend/admin/src/constants/freshness.ts` | New: FRESH_MS, DEGRADED_MS, getFreshnessLevel |
| `frontend/admin/src/hooks/useServerList.ts` | staleTime 15s, refetchInterval 15s when visible |
| `frontend/admin/src/hooks/useServersStream.ts` | 60s timeout + clearTimeout in cleanup |
| `frontend/admin/src/pages/Servers.tsx` | Sync now, Last updated, offline alert, delete flow |
| `frontend/admin/src/components/ServerRow.tsx` | onDelete prop, React.memo, Delete menu item |
| `backend/app/api/v1/servers_crud.py` | DELETE /{server_id} (409 if devices exist) |
| `backend/tests/test_api_integration.py` | test_servers_delete_requires_auth_401 |

### Backend DB compatibility

- **Snapshots summary** (`GET /servers/snapshots/summary`): Uses `distinct(ServerSnapshot.server_id)` with `order_by`. This is PostgreSQL-compatible; SQLite does not support `DISTINCT ON`. Production requires Postgres.

### Agent mode: Last sync / last_snapshot_at

- In agent mode, manual Sync queues an action to the node-agent; `run_sync_for_server` is never called on the control-plane, so `Server.last_snapshot_at` was never updated.
- **Fix** (`backend/app/api/v1/agent.py`): When agent reports `actions/report` with `type=sync` and `status=completed`, update `Server.last_snapshot_at = now` and invalidate servers list cache.
- The stream emits `last_snapshot_at` every 3s, so the frontend receives the update within one tick.
