# API Audit

**Date:** 2026-02-24  
**Scope:** VPN Suite Admin API (FastAPI)

---

## TODOS

| # | Todo | Module | Priority |
|---|------|--------|----------|
| T1 | Add Idempotency-Key to POST /servers, POST /subscriptions | servers.py, subscriptions.py | P3 |
| T2 | Migrate list endpoints to shared PaginationParams (schemas/base.py) | users, devices, payments, audit, peers, plans, subscriptions, cluster | P3 |
| T3 | Add contract tests (OpenAPI vs implementation) | tests/ | P3 |
| T4 | Document WebApp session 1h expiry; consider refresh flow | webapp.py, docs | P3 |
| T5 | Add explicit transaction boundary in bulk_revoke (already uses single commit; consider savepoint for partial rollback) | devices.py | P3 |

---

## ISSUES

### P0 — Critical

| # | Issue | Endpoint | Notes |
|---|-------|----------|-------|
| I1 | — | — | *None; webhook provider allowlist + telegram_stars secret already in place* |

### P1 — High

| # | Issue | Endpoint | Notes |
|---|-------|----------|-------|
| I2 | Bot can reset any device via POST /api/v1/devices/{id}/reset | devices.reset_device | Uses `get_admin_or_bot`; bot has no user scoping. Admin reset is fine; bot should only reset devices belonging to users in its context. Compare: POST /api/v1/bot/devices/{id}/revoke requires tg_id and validates device ownership. |
| I3 | Agent heartbeat accepts unbounded server_id | agent.agent_heartbeat | `AgentHeartbeatIn.server_id` has no max length. Malicious agent can send huge payload. |

### P2 — Medium

| # | Issue | Endpoint | Notes |
|---|-------|----------|-------|
| I4 | log/frontend-error: message has no max_length | log.log_frontend_error | Pydantic accepts unbounded string; logging slices at 500 but body still parsed. Add `Field(max_length=2000)` to FrontendErrorIn.message. |
| I5 | Inconsistent error detail shape | Multiple | Some use `detail="string"`, others `detail={"code": "X", "message": "Y"}`. http_exception_to_error_response normalizes but clients parsing raw 404 may see inconsistency. |
| I6 | telemetry/docker logs: since param | telemetry_docker.docker_container_logs | `_parse_since` validates; invalid format → 400. Injection risk low (value passed to docker API). Consider strict regex for format. |

### P3 — Low

| # | Issue | Endpoint | Notes |
|---|-------|----------|-------|
| I7 | cluster/nodes no pagination | cluster.get_cluster_nodes | Scale concern if 1000+ nodes; add limit/offset if needed. |
| I8 | create_server, create_subscription no Idempotency-Key | servers, subscriptions | Duplicate POST creates duplicate resources. |

---

## FIXES

### F1 — Bot reset_device scoping (P1)

**File:** `backend/app/api/v1/devices.py`

When `_principal` is `BotPrincipal`, require `tg_id` in body and verify `device.user_id == user.id` for that tg_id. Option: add optional `ResetRequest.tg_id`; when principal is bot, require it and validate ownership.

```python
# In reset_device:
if isinstance(_principal, BotPrincipal):
    if not (body and body.tg_id is not None):
        raise HTTPException(400, detail={"code": "TG_ID_REQUIRED", "message": "Bot must provide tg_id"})
    user_r = await db.execute(select(User).where(User.tg_id == body.tg_id))
    user = user_r.scalar_one_or_none()
    if not user:
        raise HTTPException(404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})
    if device.user_id != user.id:
        raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Device not owned by user"})
```

**Schema:** Add `tg_id: int | None = None` to `ResetRequest`.

---

### F2 — Agent heartbeat server_id validation (P1)

**File:** `backend/app/schemas/agent.py`

```python
server_id: str = Field(..., max_length=64, description="Control-plane server_id")
```

**File:** `backend/app/api/v1/agent.py`  
Validate format (e.g. UUID-like or alphanumeric) before Redis/db usage if desired.

---

### F3 — FrontendErrorIn message max_length (P2)

**File:** `backend/app/api/v1/log.py`

```python
class FrontendErrorIn(BaseModel):
    message: str = Field(..., max_length=2000)
    stack: str | None = Field(default=None, max_length=5000)
    component_stack: str | None = Field(default=None, alias="componentStack", max_length=2000)
    ...
```

---

### F4 — Standardize 404/400 error shape (P2)

**Approach:** Use `not_found_404(resource, id)` and `bad_request_400(code, message)` from `error_responses` everywhere. Ensure `http_exception_to_error_response` normalizes `detail` when it's a string. Most 404s already use `not_found_404`; remaining string `detail=` should be migrated to `error_body` or structured dict.

---

### F5 — Idempotency-Key for create_server, create_subscription (P3)

Follow pattern from `users.issue_user_device` (Redis key `idempotency:issue:{key}`). Add `Idempotency-Key` header, check cache before create, store result on success.

---

## Summary

| Severity | Count |
|----------|-------|
| P0       | 0     |
| P1       | 2     |
| P2       | 3     |
| P3       | 2+    |

**Already addressed (from prior audit):**
- Webhook provider allowlist (`ALLOWED_WEBHOOK_PROVIDERS`)
- devices list limit le=200
- telemetry since validation via `_parse_since`
