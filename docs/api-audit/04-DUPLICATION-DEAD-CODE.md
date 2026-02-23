# Duplication & Dead Code Sweep

**Audit Date:** 2025-02-21

---

## 1. Duplicate Clusters

### Pagination (limit/offset)

| File | Symbol | Current |
|------|--------|---------|
| users.py | list_users | Query(50, ge=1, le=200), Query(0, ge=0) |
| payments.py | list_payments | Query(50, ge=1, le=200), Query(0, ge=0) |
| subscriptions.py | list_subscriptions | Query(50, ge=1, le=200), Query(0, ge=0) |
| audit.py | list_audit_logs | Query(50, ge=1, le=200), Query(0, ge=0) |
| devices.py | list_devices | Query(20, ge=1, le=**1000**), Query(0, ge=0) |
| peers.py | list_peers | Query(50, ge=1, le=200), Query(0, ge=0) |
| plans.py | list_plans | (via get_admin_or_bot; no pagination params) |
| servers.py | list_servers | Query(50, ge=1, le=200) + page/page_size |

**Proposal:** Shared `PaginationParams(limit: int = 50, offset: int = 0)` in schemas/base.py with max_limit=200. Apply to all list endpoints. Migration: add dependency, replace inline Query params.

### Error detail shape

| Pattern | Occurrences |
|---------|-------------|
| `detail="string"` | peers.py, devices.py, cluster.py, auth.py, subscriptions.py, plans.py, wg.py, servers_peers.py, etc. |
| `detail={"code": "X", "message": "Y"}` | webapp.py, bot.py, outline.py, agent.py, webhooks (401) |
| `not_found_404(resource, id)` | admin_configs.py |

**Proposal:** Use `not_found_404` and `bad_request_400(code, message)` from error_responses everywhere. Migration: replace string detail with dict; ensure http_exception_to_error_response normalizes both (already does).

### Rate limit helpers

| Symbol | File | Scope |
|--------|------|-------|
| rate_limit_login_failure | rate_limit.py | login |
| rate_limit_admin_issue | rate_limit.py | POST servers/:id/peers |
| rate_limit_server_actions | rate_limit.py | POST servers/:id/actions |
| rate_limit_config_download | rate_limit.py | config download/qr |
| rate_limit_outline_keys_mutate | rate_limit.py | outline keys |
| GlobalAPIRateLimitMiddleware | rate_limit.py | all /api/* |

**Status:** Already centralized in rate_limit.py. No duplication.

### Config token resolve

| File | Symbol |
|------|--------|
| admin_configs.py | _resolve_config |

**Status:** Single use; keep as-is.

---

## 2. Dead Code

| File | Symbol | Notes |
|------|--------|-------|
| server_utils.py | get_agent_heartbeat, _agent_heartbeat_server_ids, _display_is_active | Used by servers/telemetry; verify usage |
| control_plane.py | _require_runtime_write_ops | Def factory; verify used |
| exception_handling.py | raise_http_for_control_plane_exception | Used in peers.py, wg.py; not in all control-plane routes |

**Recommendation:** Run `grep -r "get_agent_heartbeat\|_display_is_active" backend/` to confirm. No obvious dead handlers.

---

## 3. Migration Steps

### Pagination unification

1. Add `PaginationParams` to schemas/base.py.
2. For each list endpoint: replace `limit: Query(...), offset: Query(...)` with `Depends(PaginationParams)`.
3. Change devices.py limit max from 1000 to 200.
4. Add test: pagination params enforce max 200.

### Error envelope unification

1. Add `bad_request_400(code, message)`, `forbidden_403(code, message)` to error_responses.py.
2. Replace `raise HTTPException(..., detail="...")` with `raise not_found_404(...)` or equivalent in high-traffic routes (peers, devices, cluster).
3. Test: all 404/400 have `error.code`, `error.message` in response.
