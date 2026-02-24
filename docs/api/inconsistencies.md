# API Inconsistencies (Code Evidence)

This document lists *current* inconsistencies observed directly in code and runtime configuration.

---

## Pagination Model Drift

- **No unified pagination schema in use.** `PaginationParams` exists but is not referenced in any API route.
  - Evidence: `backend/app/schemas/base.py`
- **Mixed pagination styles.** Most list endpoints use `limit`/`offset`, while `GET /api/v1/servers` additionally supports `page` + `page_size` overrides.
  - Evidence: `backend/app/api/v1/servers.py`
- **Some list endpoints have no pagination at all** (e.g. cluster topology / nodes).
  - Evidence: `backend/app/api/v1/cluster.py`

**Impact:** inconsistent client behavior and brittle SDKs. Standardize on a single pagination contract.

---

## Success Envelope Variance

- Some endpoints return Pydantic models (typed responses), while others return ad‑hoc objects like `{ "status": "ok" }`.
  - Examples: `auth.logout`, `auth.totp_disable`, `webhooks.payment_webhook`.
  - Evidence: `backend/app/api/v1/auth.py`, `backend/app/api/v1/webhooks.py`

**Impact:** success responses are not uniform across services.

---

## Timestamp Naming Variance

- Schemas mix `ts`, `created_at`, `issued_at`, `last_seen_at`, `probe_ts`.
  - Evidence: `backend/app/schemas/action.py`, `backend/app/schemas/docker_telemetry.py`, `backend/app/schemas/server.py`, `backend/app/schemas/control_plane.py`

**Impact:** clients must handle multiple timestamp conventions.

---

## Field Casing / Aliases

- Mixed snake_case and camelCase input aliases.
  - `FrontendErrorIn` accepts `componentStack`, `buildHash`, `userAgent`.
    - Evidence: `backend/app/api/v1/log.py`
  - `WebAppAuthRequest` accepts `initData` or `init_data`.
    - Evidence: `backend/app/api/v1/webapp.py`
  - Docker telemetry uses serialization aliases `from`/`to`.
    - Evidence: `backend/app/schemas/docker_telemetry.py`

**Impact:** schema casing is inconsistent across endpoints.

---

## Auth Scope Mixing

- Bot endpoints use `get_admin_or_bot`, which also accepts WebApp bearer sessions. This allows WebApp sessions to call `/api/v1/bot/*` unless explicitly rejected in handlers.
  - Evidence: `backend/app/api/v1/bot.py`, `backend/app/core/bot_auth.py`

**Impact:** scope boundaries are blurred; clarify intended access and split dependencies if needed.
