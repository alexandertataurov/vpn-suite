# Top Findings — Optimization Audit

Each item: **location**, **root cause**, **fix**, **expected impact**, **how to validate**.

---

## Top 10 latency bottlenecks

| # | Location | Root cause | Fix | Expected impact | Validate |
|---|----------|------------|-----|-----------------|----------|
| 1 | `backend/app/api/v1/servers.py` _fetch_servers_list_uncached | 3 queries: count + list + last_seen map | Combine last_seen into main list query (lateral/subquery) | −1 round-trip, lower P95 | Prometheus http_request_duration_seconds for GET /api/v1/servers |
| 2 | GET /api/v1/devices | No list cache; every request hits DB + Redis mget | Add Redis cache (30–60s TTL, key by params), invalidate on device write | Lower P50/P95 on hot path | Baseline script, db_time_per_request_seconds |
| 3 | Backend | DB/node timing was missing | Done: db_queries_per_request, db_time_per_request_seconds, node_runtime_call_duration_seconds | Observability | Prometheus histograms |
| 4 | Telemetry poll loop | Sequential per server when node_telemetry_concurrency=0 | Set NODE_TELEMETRY_CONCURRENCY (e.g. 5) for parallel fetches | Shorter poll cycle | telemetry_poll_duration_seconds |
| 5 | GET /api/v1/telemetry/snapshot | Full snapshot every time; since= ignored | Implement delta (return only changes since cursor) or document fields= minimal | Smaller payload, faster response | Response size, telemetry_snapshot_request_duration_seconds |
| 6 | Control Plane page | 6+ useQuery with 15–60s refetch | Single “control plane dashboard” endpoint (P2) or reduce refetch intervals | Fewer round-trips | Network tab, requests/min |
| 7 | Server Detail peers tab | refetchInterval 3s | Increase to 5–10s or use refetchWhenVisible | Less load | Requests/min |
| 8 | Devices/servers list | Offset pagination for large offset | Cursor pagination (P2) for deep pages | Stable latency at high offset | P95 at offset=1000 |
| 9 | Sync/reconcile | Fan-out to nodes on request path | Already background; ensure no sync call in hot request path | — | Audit |
| 10 | Health check loop | Blocks or delays | Ensure non-blocking; document interval | — | Logs, metrics |

---

## Top 10 CPU/RAM waste

| # | Location | Root cause | Fix | Expected impact | Validate |
|---|----------|------------|-----|----------------|----------|
| 1 | `frontend/admin/src/pages/Devices.tsx` | VirtualTable only when displayDevices.length > 50 | Use VirtualTable when limit or total >= 50 (or always for table) | Less DOM for large lists | Render time with 1k rows |
| 2 | Admin UI | Multiple polling timers (devices 90s, servers 60s, Control Plane 15–60s) | Dedupe; visibility-based; single dashboard endpoint | Lower CPU and network | Requests/min per tab |
| 3 | Telemetry snapshot | Full snapshot every request | Delta or fields= minimal | Less serialization and transfer | Payload size |
| 4 | Devices page | List + summary two requests at same interval | Single endpoint or shared cache key | Fewer requests | Network tab |
| 5 | Bundle | No tree-shake audit | Audit heavy deps; optional rollup-plugin-visualizer | Smaller bundle | dist size, chunk analysis |
| 6 | Backend workers | All in-process (acceptable) | — | — | — |
| 7 | Docker | Image layers not cached in CI | Use buildx cache or cache-from | Faster CI | Workflow duration |
| 8 | Log volume | No sampling doc | Document log level and sampling | — | Doc |
| 9 | React re-renders | Possible over-render on list pages | React DevTools profiler | Smoother UI | DevTools |
| 10 | CI | No Docker layer cache | Add cache for admin-api build | Faster builds | CI time |

---

## Top 10 overengineering targets

| # | Location | Root cause | Fix | Expected impact | Validate |
|---|----------|------------|-----|-----------------|----------|
| 1 | Control Plane | Multiple endpoints (topology, business, security, anomaly, automation, events) | One combined dashboard payload (P2) | Simpler frontend, fewer round-trips | Code size, request count |
| 2 | Backend list endpoints | Duplicate list + count pattern (devices, servers, users) | Shared helper or document pattern | Less duplication | Lines of code |
| 3 | Middleware | Optional DB metrics | Now always-on; no toggle needed | — | — |
| 4 | Frontend | Many refetchInterval constants scattered | Centralize in a config or hooks | Easier tuning | Grep refetchInterval |
| 5 | “Last updated” logic | Duplicate in several components | Single hook or util | — | Grep |
| 6 | Servers list | Cache key excludes last_seen_within_hours (by design) | Document in API or code comment | Clarity | Doc |
| 7 | Telemetry | Full snapshot when fields= could reduce | Document recommended fields= for dashboard | Smaller payloads | Doc |
| 8 | Node runtime | Wrapper adds one layer | Keep; instrumentation value outweighs | — | — |
| 9 | E2E | networkidle can hang with polling | Use domcontentloaded or wait for selector | Stable E2E | E2E pass rate |
| 10 | Backend routers | Flat structure; no excess abstraction | Keep; no change | — | — |
