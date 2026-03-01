# Top Findings — VPN Suite
> **Date**: 2026-02-26

---

## Top 10 Latency Bottlenecks

### L1. Triple Config Build on Peer Issue ⚠ HIGH IMPACT
- **Location**: `backend/app/services/admin_issue_service.py` lines 287–390
- **Root cause**: `admin_issue_peer()` calls `build_amnezia_client_config()`, `build_wg_obfuscated_config()`, and `build_standard_wg_client_config()` sequentially with identical inputs. Each calls crypto functions to generate keys and config text.
- **Fix**: Extract `_build_all_configs(server_public_key, client_private_key, endpoint, dns, obfuscation, mtu, address, preshared_key)` helper called once.
- **Expected impact**: Cuts CPU work by ~60% (~50–150 ms saved per issue).
- **Validate**: Time `POST /servers/{id}/peers/issue`.

### L2. No Server-Side Pagination on Devices List ⚠ HIGH IMPACT
- **Location**: `backend/app/api/v1/devices.py`
- **Root cause**: `GET /devices` serialization latency scaling with row count. At 1000 devices, full table scan + JSON serialization blocks the event loop.
- **Fix**: Apply `limit/offset` pagination as default; return `items` and `total`.
- **Expected impact**: P95 drops from ~400 ms to ~20 ms.
- **Validate**: Network tab in browser on devices page.

### L3. Full Table Scan on Reconciliation per Cycle
- **Location**: `backend/app/services/reconciliation_engine.py` line 264
- **Root cause**: Every 60s, queries all `Device` records for a node. At 10K total devices, this is heavy.
- **Fix**: Add `updated_at > last_sync_time` parameter; only reconcile if drift exists.
- **Expected impact**: Huge DB read IO reduction.
- **Validate**: pg_stat_statements.

### L4. Single Uvicorn Worker
- **Location**: `backend/Dockerfile` line 45
- **Root cause**: `--workers "1"` blocks the single event loop whenever CPU-bound config generation happens.
- **Fix**: Add `WEB_CONCURRENCY` support, default to 2 or 4 based on CPUs.
- **Expected impact**: 2-4x higher RPS under concurrent user load.
- **Validate**: k6 load test on config endpoints.

### L5. Node Telemetry Fan-out Blocking `/telemetry/snapshot` Response
- **Location**: `backend/app/services/telemetry_snapshot_aggregator.py`
- **Root cause**: Real-time snapshot hits docker socket via async fan-out. Slowest node dictates API latency.
- **Fix**: Background poll + Redis cache; serve stale snapshot from Redis instantly.
- **Expected impact**: P95 ~1.5 s -> ~5 ms.

### L6. Network Check on Every Heartbeat Cycle (Agent)
- **Location**: `node-agent/agent.py` line 556
- **Root cause**: Runs `iptables` and `sysctl` via `docker exec` every 10s.
- **Fix**: Cache these heavy exec checks for 60s.
- **Expected impact**: Decreased CPU overhead on the node.

### L7. `Devices.tsx` Full DOM Render (No Virtualization)
- **Location**: `frontend/admin/src/pages/Devices.tsx`
- **Root cause**: Rendering 1000 `<tr>` elements causes 300-600ms main thread blocks.
- **Fix**: Add `@tanstack/react-virtual` for row virtualization.
- **Expected impact**: Sub-50ms render, instantly smooth scrolling.

### L8. `admin_rotate_peer` Re-fetches Server + Profile Redundantly
- **Location**: `backend/app/services/admin_issue_service.py`
- **Root cause**: Redundant DB lookups during key rotation.
- **Fix**: Helper functions and aggressive local caching.

### L9. `/health/ready` Instantiates Heavy Topology Engine
- **Location**: `backend/app/main.py` line 327
- **Root cause**: Liveness probe does heavy `TopologyEngine` instantiation and query.
- **Fix**: Move cluster health check to background task, read boolean flag in `/health/ready`.
- **Expected impact**: Drops latency from 200ms -> 2ms.

### L10. Frontend No Route-Level Code Splitting
- **Location**: `frontend/admin/src/App.tsx`
- **Root cause**: Eager imports bundle everything into one ~3MB entry file.
- **Fix**: React.lazy + Suspense for route chunks.
- **Expected impact**: Halves initial load payload size.

---

## Top 10 CPU/RAM Waste Sources

### R1. Prometheus 365d Local Retention ⚠ HIGH WASTE
- **Location**: `docker-compose.yml` line 221
- **Root cause**: `--storage.tsdb.retention.time=365d` uses 10-50GB disk, eating RAM.
- **Fix**: 30d retention + remote-write.

### R2. Monitoring Stack Lacks Resource Limits ⚠ CRITICAL RELIABILITY
- **Location**: `docker-compose.yml`
- **Root cause**: `monitoring_default` service anchor has no cpus/mem limits. Alert storms crash host.
- **Fix**: Add `cpus` and `mem_limit` to Prometheus (1g), Loki (512m), Grafana (512m).

### R3. 8 Background Tasks in Single Process
- **Location**: `backend/app/main.py`
- **Root cause**: uvicorn runs 8 background tasks sharing event loop with web server.
- **Fix**: Migrate to Celery/ARQ when scale hits >50 nodes.

### R4. Triple Config Encryption on Issue
- **Location**: `backend/app/services/admin_issue_service.py`
- **Root cause**: AES encrypt 3 full configs every token.
- **Fix**: Deprecate duplicated config payloads.

### R5. Docker Socket Writable Default
- **Location**: `docker-compose.yml`
- **Root cause**: `admin-ip-watcher` mounts socket r/w.
- **Fix**: Mount `:ro` by default, grant least privilege.

### R6. Docker PS Double Check Fallback
- **Location**: `node-agent/agent.py` line 265
- **Root cause**: Tries Docker SDK, falls back to raw CLI execs. Dead code paths exist.
- **Fix**: Unify discovery wrapper, drop old legacy raw `docker ps`.

### R7. TanStack Query `staleTime: 0`
- **Location**: `frontend/admin/src/hooks`
- **Root cause**: Components fetch instantly on mount, causing duplicate hits on route change.
- **Fix**: Set default staleTime `30000` (30s) globally for `react-query`.

### R8. Reconcile Null-Node Spinloop
- **Location**: `backend/app/services/reconciliation_engine.py`
- **Root cause**: If zero nodes, it spins querying empty loops.
- **Fix**: Early return if `len(nodes) == 0`.

### R9. Loki Without Compaction Limits
- **Location**: `config/monitoring/loki-config.yml`
- **Root cause**: Writes infinitely.
- **Fix**: Apply retention rules in YAML.

### R10. God-Classes (Agent + Issue Service)
- **Location**: `admin_issue_service.py` (919 lines) / `agent.py` (1333 lines)
- **Root cause**: Memory bloat, slow parsing/cold starts.
- **Fix**: Modularize.

---

## Top 10 Overengineering Targets

### O1. `config.py` — 80+ Settings Fields
- **Location**: `backend/app/core/config.py`
- **Issue**: Massive Pydantic `Settings`. Hard to reason about domains.
- **Fix**: Sub-category dataclasses.

### O2. `control_plane_service.py` God Class
- **Location**: `backend/app/services/control_plane_service.py`
- **Issue**: Combines clustering, failover, probe, websocket broadcast.
- **Fix**: Split bounds cleanly.

### O3. `wg` and `wg_obf` Redundant Generation
- **Location**: `backend/app/services/admin_issue_service.py`
- **Issue**: Users almost always consume AWG. Generating 3 templates is wasteful.
- **Fix**: Keep only `awg`. Deprecate standard variants if 100% of client-base is modified.

### O4. `db_metrics_middleware` Query Counters
- **Location**: `backend/app/core/db_metrics.py`
- **Issue**: Hand-rolled query counters in middleware add overhead vs just logging slow queries.
- **Fix**: Move to pg_stat_statements based async job instead of per-request instrumentation.

### O5. Excessive Polling over WebSockets
- **Location**: Frontend <-> Backend
- **Issue**: UI polling endpoints every 30s while also maintaining WS.
- **Fix**: Shift pure data to SSE/WS stream entirely.

### O6. `node_discovery: "docker" | "agent"` Matrix
- **Location**: Everywhere
- **Issue**: Dual modes for simple local docker vs remote agent creates conditional spaghetti throughout the backend (`if settings.node_discovery == ...`).
- **Fix**: Consolidate around Agent pattern entirely. Make local docker run the agent container too. Unifies logic paths.

### O7. Hand-Rolled Rebalance Algorithms
- **Location**: `control_plane_automation_task.py`
- **Issue**: Rolling your own clustered load-balancer re-shuffles.
- **Fix**: Abstract.

### O8. Multiple Authentication Methods
- **Location**: `auth.py`
- **Issue**: JWT + API keys + Webhook Hash.
- **Fix**: Unify token paths.

### O9. Complex React State Management vs Query Cache
- **Location**: `frontend/*/store`
- **Issue**: Trying to put API state in Context/Redux when ReactQuery already handles it.
- **Fix**: Strip custom contexts, rely exclusively on TRPC/Query.

### O10. Idempotency `idempotency_ttl_seconds`
- **Location**: DB / Redis
- **Issue**: 24h caching of API POST keys is overkill for simple button clicks.
- **Fix**: Lower to 5 mins.
