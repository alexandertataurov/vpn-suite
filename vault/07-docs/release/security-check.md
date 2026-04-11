# Phase 5 — Security Check

**Deliverable:** Security verification report for release.

---

## 1. Change Impact (from change-scope)

| Change | Risk |
|--------|------|
| Outline API removal | Low — reduces attack surface |
| Rate limit middleware | Medium — verify coverage |
| Security docs restructured | Low |

---

## 2. Auth & RBAC

| Area | Implementation |
|------|----------------|
| Admin API | JWT (auth/login, refresh); RBAC `require_permission` on protected routes |
| Agent API | X-Agent-Token (constant-time compare) |
| Bot API | `get_admin_or_bot` (admin JWT or bot API key) |
| Webhooks | X-Telegram-Bot-Api-Secret-Token (telegram_stars); compare_digest |
| WebSocket | Control-plane events: token in query params |
| Production secrets | `validate_production_secrets()` enforces non-default SECRET_KEY, ADMIN_PASSWORD, ban_confirm_token when ENVIRONMENT=production |

**Tests:** `test_authz_boundaries.py`, `test_quick_wins.py` — 401 without auth on /servers, /devices, /payments, /cluster/topology.

---

## 3. Rate Limits

| Scope | Config | Fail mode |
|-------|--------|-----------|
| Login failures | `login_rate_limit`, `login_rate_window_seconds` | 429; fail-open if Redis down |
| Global API | `api_rate_limit_per_minute`, `api_rate_limit_window_seconds`; applies to `/api/*` | 429; fail-open if Redis down |
| Admin issue | `rate_limit_admin_issue` on POST /servers/{id}/peers | Per-IP + per-admin |
| Config download | `rate_limit_config_download` | Per-IP + per-token |
| Server actions | `rate_limit_server_actions` | Per-server + per-admin |
| Issue device (users) | `issue_rate_limit_per_minute` | Per-user |

**Tests:** `test_security.py` — api_rate_limit_health_not_limited, api_rate_limit_under_limit_returns_401_not_429.

---

## 4. CORS

- **Config:** `cors_allow_origins` (comma-separated); no `*` in production.
- **Main:** "CORS: explicit origins from env; no * in prod (security)".

---

## 5. Secrets & Redaction

| Item | Handling |
|------|----------|
| Logging | `redact_for_log()` — passwords, tokens, keys replaced with REDACTED |
| Request logging | No secrets in request/response logs |
| Webhook secrets | `secrets.compare_digest` for constant-time comparison |

**Tests:** `test_security.py` — redaction, 500 no traceback, invalid token, SSRF validation.

---

## 6. Endpoints Without Auth

| Endpoint | Purpose |
|----------|---------|
| /health | Liveness; no auth |
| /metrics | Prometheus scrape; internal network only |
| /webhooks/payments/{provider} | Webhook; verified via X-Telegram-Bot-Api-Secret-Token when configured |

---

## 7. Checklist

- [x] Auth required on /api/v1/* (except auth/login, webhooks)
- [x] Rate limit on login failures
- [x] Global API rate limit on /api/*
- [x] Rate limit on admin issue, config download, server actions
- [x] CORS explicit origins (no *)
- [x] Production secrets validation (ENVIRONMENT=production)
- [x] Redaction in logs
- [x] Outline API removed (reduced surface)

---

## 8. Summary

| Area | Status |
|------|--------|
| Auth / RBAC | OK |
| Rate limits | OK |
| CORS | OK |
| Secrets / redaction | OK |
| Security tests | OK |

**Recommendation:** Run `pytest tests/test_security.py tests/test_authz_boundaries.py` before release. Ensure ENVIRONMENT=production and non-default secrets in production.
