# Systems Audit

**Audit Date:** 2025-02-21

---

## A) Routing & Versioning

| Aspect | Status | Notes |
|--------|--------|------|
| Path consistency | OK | `/api/v1/` prefix; resource/{id} pattern |
| Resource naming | Minor | Mixed: `control-plane` (kebab), `peers` (alias over devices) |
| Versioning | Single | No v2; no deprecation headers |
| Idempotency | Partial | Webhooks (external_id), issue (Idempotency-Key); other POSTs lack it |

---

## B) Auth Threat Review

| Risk | Location | Severity | Impact | Fix |
|------|----------|----------|--------|-----|
| Webhook auth | [webhooks.py](../backend/app/api/v1/webhooks.py): `_verify_telegram_stars_secret` only for `provider=telegram_stars` | **P0** | Other providers (mock, future) receive unauthenticated webhooks; replay/fake payment risk | Enforce provider allowlist; add HMAC/signature per provider; reject unknown |
| Webapp initData | [webapp.py](../backend/app/api/v1/webapp.py): `validate_telegram_init_data` | P1 | HMAC; if BOT_TOKEN weak/leaked → session forgery | Document token rotation; 503 when token not set |
| Bot API key optional | [bot_auth.py](../backend/app/core/bot_auth.py): `bot_api_key` empty → falls to JWT | P1 | Bot routes callable with JWT if key not set | Document BOT_API_KEY required; consider 503 when empty on bot routes |
| Agent token on 80/443 | [Caddyfile](../../config/caddy/Caddyfile) | P2 | Agent on 443 uses X-Agent-Token; mTLS only on 8443 | Verify: 80/443 route /api/* to admin-api; agent intended on 8443 only |
| Role without permissions | [rbac.py](../backend/app/core/rbac.py) | P2 | Admin with null role_id → 403 | Correct |
| Refresh rotation fail-open | [auth.py](../backend/app/api/v1/auth.py) | P2 | Redis down → blocklist set can fail; replay within TTL possible | Document; optional fail-closed |

**Permission model:** [constants.py](../backend/app/core/constants.py) — PERM_* strings; Role.permissions JSONB; `*` = all.

---

## C) Validation & Serialization

| Aspect | Status | Notes |
|--------|--------|------|
| Input validation | Mixed | Pydantic bodies; Query(ge=1, le=200) for limit/offset |
| **devices limit=1000** | **P1** | [devices.py](../backend/app/api/v1/devices.py):71 — DoS risk; cap at 200 |
| Output | Mixed | Most use response_model; peers return raw dicts |
| Pagination | Inconsistent | No shared schema; devices allows 1–1000, others 1–200 |
| Dates | OK | ISO 8601 |
| File upload | N/A | Config download by token only |

---

## D) Error Handling & API Semantics

| Aspect | Status | Notes |
|--------|--------|------|
| Envelope | OK | [error_responses.py](../backend/app/core/error_responses.py) — `{ success, data, error: { code, message, details? }, meta }` |
| HTTP mapping | OK | http_exception_to_error_response; _STATUS_TO_CODE |
| Detail format | Inconsistent | Mix of `detail="string"` and `detail={"code","message"}` |
| Traceback | OK | Never exposed (test_security.py) |
| Control-plane exceptions | Partial | [exception_handling.py](../backend/app/core/exception_handling.py); not all routes use it |

---

## E) Data Access Layer

| Aspect | Status | Notes |
|--------|--------|------|
| ORM | OK | SQLAlchemy 2 async |
| Transactions | Explicit | db.commit() in handlers |
| N+1 | Partial | devices uses selectinload; others may lack |
| Indexes | OK | Migrations add indexes |
| Concurrency | OK | Webhook idempotency; IntegrityError handled |

---

## F) Observability — Gaps + Instrumentation Plan

| Gap | Current | Target |
|-----|---------|--------|
| Tracing | No OpenTelemetry; trace_id = request_id | Add OTel spans; propagate trace_id |
| Structured logs | JSON, request_id, redaction | OK; ensure all errors log request_id |
| Metrics | http_requests_total, http_errors_total, cluster/peer metrics | Add DB pool, queue depth if applicable |
| Audit logs | audit_middleware writes for audit_admin_id | OK |
| Log redaction | [redaction.py](../backend/app/core/redaction.py) | OK |

**Instrumentation plan:**
1. Add X-Trace-ID support; propagate in response headers.
2. Document OTel future in docs/observability.
3. Add DB connection pool metrics if SQLAlchemy supports.
4. Ensure audit for all mutating operations (webhooks use "webhook").

---

## G) Performance & Reliability

| Aspect | Status | Notes |
|--------|--------|------|
| Rate limits | OK | Global 200/min; login; admin issue; config download; server actions; outline keys |
| Timeouts | OK | Outline, Docker telemetry configurable |
| Payload | OK | Webhook 1 MB limit |
| Graceful shutdown | OK | lifespan cancels tasks, closes Redis |
| Pagination max | **P1** | devices 1000 → reduce to 200 |

---

## H) Documentation

| Aspect | Status |
|--------|--------|
| OpenAPI | Auto-generated; large; some paths sparse |
| Export | scripts/export_openapi.py |
