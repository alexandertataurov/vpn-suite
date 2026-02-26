# Prioritized TODO Roadmap — Optimization Audit

---

## P0 (same day — biggest wins)

- **Remove servers list extra query:** Combine last_seen into main list query in `backend/app/api/v1/servers.py` (_fetch_servers_list_uncached) so list_servers uses 2 queries instead of 3.
- **Add missing DB index(es):** Add index on Device(server_id, revoked_at) and/or Server(status) if not present (check alembic/versions).
- **Add devices list cache:** Redis cache for GET /api/v1/devices (30–60s TTL, key by query params), invalidate on device create/update/revoke/delete.
- **VirtualTable for Devices:** Use VirtualTable for Devices table view when limit >= 50 or total >= 50 (or always for table view when data is paginated).
- **Reduce duplicate polling:** Dedupe devices list + summary (single endpoint or shared cache); or ensure React Query staleTime avoids redundant refetch on tab focus.
- **Reduce telemetry snapshot payload:** Document recommended `fields=` for dashboard; or implement delta (since= cursor) for reduced payload.

---

## P1 (1–3 days)

- **Telemetry snapshot delta:** Implement delta in GET /api/v1/telemetry/snapshot when `since=` is provided (return only changed nodes/devices since cursor).
- **Reconcile queue/worker:** Optional; keep in-process with better timeouts and circuit-breaker style backoff for node runtime calls.
- **Circuit breakers and timeouts:** Add timeouts and optional circuit breaker for node runtime adapter calls (list_peers, add_peer, remove_peer).
- **Background fan-in:** Verify no synchronous fan-out to nodes on request path; telemetry and reconcile remain in background.

---

## P2 (1–2 weeks)

- **Simplify Control Plane:** One combined “control plane dashboard” endpoint to reduce frontend round-trips.
- **Remove dead code:** Run coverage; remove unused routes or branches.
- **Consolidate list+count pattern:** Shared helper or documented pattern for devices, servers, users list endpoints.
- **Test strategy:** Improve coverage; stabilize flaky E2E (e.g. avoid networkidle with polling).
- **Cursor pagination:** Add cursor-based pagination for devices/servers (issued_at/created_at) for deep pages.
