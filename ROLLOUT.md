# Rollout and Rollback — Optimization Audit

For each P0/P1 change: feature flag (if applicable), rollback steps, risk.

---

## P0 changes (implemented)

### Servers list: 2 queries instead of 3

- **Feature flag:** None.
- **Rollback:** Revert commit that merged last_seen into main list query in `backend/app/api/v1/servers.py` (restore separate last_seen query and loop).
- **Risk:** Low. Same response shape; one fewer DB round-trip.

### Devices list cache (Redis, 45s TTL)

- **Feature flag:** Could add `DEVICES_LIST_CACHE_ENABLED=false` to disable; currently always on.
- **Rollback:** In `backend/app/api/v1/devices.py` list_devices: skip cache get/set (comment out or gate with env); call `invalidate_devices_list_cache()` on write paths can remain (no-op if cache unused).
- **Risk:** Low. Stale list for up to 45s after device create/update/revoke; invalidation on all write paths limits staleness.

### DB and node instrumentation

- **Feature flag:** None (middleware and wrapper always on).
- **Rollback:** Remove `DbMetricsMiddleware` and SQLAlchemy event listeners; remove `TimingNodeRuntimeAdapter` wrapper in main.py.
- **Risk:** Low. Observability only; no behavior change.

### Devices VirtualTable and staleTime (frontend)

- **Feature flag:** None.
- **Rollback:** Revert Devices.tsx: restore VirtualTable only when `displayDevices.length > 50`; remove `staleTime: 45_000` from devices useQuery.
- **Risk:** Low. UX and request reduction only.

### Backend Dockerfile HEALTHCHECK

- **Feature flag:** N/A.
- **Rollback:** Remove HEALTHCHECK line from Dockerfile.
- **Risk:** Low. Only affects container health reporting.

### Telemetry snapshot metric labels (scope, fields_filter)

- **Feature flag:** None.
- **Rollback:** Revert metrics.py and telemetry_snapshot.py: remove labels from histogram, use `.observe()` without `.labels()`.
- **Risk:** Low. Breaking change for dashboards that already use the metric (old series without labels); new deployments are fine.

---

## P1 (not yet implemented)

### Telemetry snapshot delta (since= cursor)

- **Feature flag:** `TELEMETRY_DELTA_ENABLED=true` to enable delta response when `since=` provided.
- **Rollback:** Disable feature flag; API continues to return full snapshot.
- **Risk:** Medium. New response shape when delta enabled; clients must handle both.

### Circuit breakers / timeouts for node runtime

- **Feature flag:** Env vars for timeout and circuit threshold.
- **Rollback:** Set timeout to very high or disable circuit breaker.
- **Risk:** Low–medium. Prevents long blocks on node calls; could mask real issues if thresholds too aggressive.
