# 100% Coverage Checklist — Optimization Audit

Per-folder walk: purpose, hot paths, waste, quick wins, risky refactors.

---

## A) Frontend (React/Vite)

**Purpose:** Admin SPA (`frontend/admin/`), Miniapp (`frontend/miniapp/`), shared (`frontend/shared/`) — UI, types, api-client.

**Hot paths:** Devices page (list + summary polling 90s), Servers (list 60s + stream), Control Plane (multiple queries 15–60s), Server Detail peers tab (3s).

**Findings:**
1. Devices: VirtualTable only when `displayDevices.length > 50` (`frontend/admin/src/pages/Devices.tsx` ~924). Use VirtualTable for table view whenever page size can be large (e.g. always when viewMode === "table" and data from server is paginated).
2. Polling: Devices page runs list + summary both at 90s; consider a single “devices list + summary” endpoint or ensure React Query dedupes.
3. Control Plane: 6+ useQuery with 15–60s refetch; consider one combined “control plane dashboard” endpoint to cut round-trips.
4. No bundle size gate in CI (added: artifact + record step).
5. Server Detail peers 3s is aggressive; consider 5–10s or visibility-based.

**Quick wins:** Always use VirtualTable for Devices table when `limit >= 50` or when total > 50; add `staleTime` for list endpoints to avoid refetch on tab focus when data is fresh; add bundle size step in CI (done).

**Risky refactors:** Merging all Control Plane queries into one endpoint (API contract change).

---

## B) Backend API

**Purpose:** `backend/app/` — FastAPI, devices, servers, telemetry, agent, auth, etc.

**Hot paths:** GET /api/v1/devices (list with filters, join User, selectinload issued_configs, then get_device_telemetry_bulk via Redis mget — already 1 round-trip for telemetry). GET /api/v1/servers: count + list + last_seen per server (3 queries); 15s Redis cache when cache_key is set (no cache when `last_seen_within_hours` is set). GET /api/v1/telemetry/snapshot: cache-only; supports `fields=` and `scope=` for smaller payloads.

**Findings:**
1. list_servers: `backend/app/api/v1/servers.py` _fetch_servers_list_uncached does count, main list, then a separate query for last_seen map; combine last_seen into main query via lateral/subquery or window to reduce to 2 queries.
2. devices list: already uses selectinload and single mget for telemetry; no N+1 on issued_configs.
3. DB query count/duration instrumentation added (DbMetricsMiddleware + SQLAlchemy events).
4. Servers list cache key excludes `last_seen_within_hours` (by design); document.
5. Cursor pagination: devices/servers use offset; for very large tables consider cursor-based pagination for “deep” pages (P2).

**Quick wins:** Collapse servers list to 2 queries (list + count with last_seen in one); add devices list cache (e.g. 30–60s TTL, key by params) for hot path.

**Risky refactors:** Changing pagination contract (cursor) breaks existing clients.

---

## C) Telemetry / observability

**Confirm:** UI does not hit nodes directly (only Admin API). Snapshot is cache-only (`backend/app/api/v1/telemetry_snapshot.py`); aggregator writes Redis (`backend/app/services/telemetry_snapshot_aggregator.py`).

**Findings:**
1. `since=` cursor for delta: API accepts it but returns full snapshot; implement delta (only changed nodes/devices since cursor) to reduce payload.
2. Payload: already has `fields=` to restrict sections; document recommended `fields=` for dashboard.
3. Polling: frontend refetch intervals 15–90s; consider adaptive (e.g. slow when tab hidden).
4. Sampling: ensure log volume and trace sampling documented in BASELINE/Observability.

**Quick win:** Document “observability of observability” (e.g. Prometheus target health, scrape failures) in BASELINE or observability docs.

---

## D) Node / Amnezia WG control plane

**Purpose:** `node-agent/agent.py`: discover AWG containers, pull peers from API, reconcile via `awg set`, heartbeat.

**Findings:**
1. Reconciliation: `backend/app/services/reconciliation_engine.py` computes diff per node; apply is per-node (one awg set per server). Node-agent batches add/remove in a single `awg set` call per node.
2. Idempotent apply: re-applying same desired state is safe.
3. Drift: reconcile loop runs periodically; metrics `vpn_reconciliation_drift` exist.
4. Failure isolation: one node failure does not block others (async gather).

**Quick wins:** Ensure apply_peers sends one batched update to awg; add timeout and circuit-breaker style backoff for node calls in backend.

---

## E) Database

**Schema:** Alembic migrations under `backend/alembic/versions/`; indexes exist for devices (e.g. issued_at), servers (created_at), users, etc.

**Findings:**
1. Devices list filters: status_filter, node_id, search (email, device_name, id); ensure composite or single-column indexes support common filters (e.g. (server_id, revoked_at), (user_id, revoked_at)).
2. Servers list: status, region, is_active, search; similar index check.
3. Pagination: offset-based; cursor for devices/servers on issued_at/created_at for P2.
4. Transactions: keep request-scoped sessions; avoid long-running transactions in background tasks.

**Quick wins:** Add missing index on Device(server_id, revoked_at) if not present; add Server(status) if filtered often.

---

## F) Docker / runtime

**Backend:** `backend/Dockerfile`: multi-stage, pip cache mount, non-root user.

**Amnezia:** `amnezia/amnezia-awg2/Dockerfile`: based on amneziawg-go; sysctl and limits.

**Findings:**
1. Backend image: slim base; no dev deps in final stage.
2. Healthcheck: add HEALTHCHECK to backend Dockerfile if missing; document startup time in BASELINE.
3. Resource limits: document in compose or k8s if applicable.
4. Network: host vs bridge for WG documented in amnezia runbooks.

**Quick wins:** Add HEALTHCHECK to backend Dockerfile; record image sizes in BASELINE.

---

## G) CI/CD

**File:** `.github/workflows/ci.yml`: lint-test, build, trivy-scan, frontend-checks, secret-scan, frontend-e2e, bot-test.

**Findings:**
1. Jobs run sequentially (no dependency DAG); lint-test, build, frontend-checks, frontend-e2e can run in parallel where independent.
2. Caching: pip and npm cache present; consider caching Docker build layers for admin-api.
3. Flaky: E2E uses “wait for API/admin” with retries; avoid networkidle where polling runs.
4. Release gates: lint, typecheck, unit, build, E2E present; bundle size step added (artifact + record).

**Quick wins:** Parallelize CI jobs (e.g. lint-test, frontend-checks, build, trivy in parallel; frontend-e2e after backend ready). Docker layer cache for admin-api build.

---

## H) Overengineering / complexity

**Spot-check:** Single shared api client and types in frontend; backend routers are flat (no excessive layering). No “framework inside the app.”

**Findings:**
1. Duplicate patterns: ensure one place for “list + count” pattern (e.g. devices, servers, users).
2. Replace complex conditionals with typed enums where it simplifies branches.
3. Dead code: run coverage and remove unused routes or branches if any.

**Quick wins:** Document “list + count” helper if repeated; add exhaustive switch/union handling where applicable (TypeScript rule already in workspace).
