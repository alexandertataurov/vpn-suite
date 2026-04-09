# API Inconsistencies (Code Evidence)

This document lists *current* inconsistencies observed directly in code and runtime configuration.

---

## Pagination Model

- **Unified pagination:** `PaginationParams` is wired for `GET /devices`, `GET /users`, and (with `limit`/`offset` in response) for `GET /servers`. List responses include `items`, `total`, `limit`, `offset`.
  - Evidence: `apps/admin-api/app/schemas/base.py`, `apps/admin-api/app/api/v1/devices.py`, `users.py`, `servers.py`
- **Servers:** Still supports `page`/`page_size` for backward compatibility; prefer `limit`/`offset`.
- **Some list endpoints have no pagination** (e.g. cluster topology / nodes).
  - Evidence: `apps/admin-api/app/api/v1/cluster.py`

---

## Success Envelope Variance

- Some endpoints return Pydantic models (typed responses), while others return ad‑hoc objects like `{ "status": "ok" }`. Current approach: document per-endpoint; optional future: add shared `{ status, message? }` schema for auth/webhooks.
  - Examples: `auth.logout`, `auth.totp_disable`, `webhooks.payment_webhook`.
  - Evidence: `apps/admin-api/app/api/v1/auth.py`, `apps/admin-api/app/api/v1/webhooks.py`

---

## Timestamp Naming Variance

- **Convention (target):** Prefer `*_at` for timestamps (e.g. `created_at`, `issued_at`, `last_seen_at`). Use `ts` only where already established (e.g. agent heartbeat `ts_utc`, telemetry `probe_ts`).
- Schemas still mix `ts`, `created_at`, `issued_at`, `last_seen_at`, `probe_ts`. New fields should use `*_at`; Pydantic aliases can preserve backward compat.
  - Evidence: `apps/admin-api/app/schemas/action.py`, `apps/admin-api/app/schemas/docker_telemetry.py`, `apps/admin-api/app/schemas/server.py`, `apps/admin-api/app/schemas/control_plane.py`

---

## Field Casing / Aliases

- **WebApp auth:** Backend accepts `initData` or `init_data`; miniapp sends `init_data` (snake_case) for consistency.
  - Evidence: `apps/admin-api/app/api/v1/webapp.py`, miniapp `useBootstrapMachine.ts` / `SessionMissing.tsx`
- Other mixed aliases: `FrontendErrorIn` accepts `componentStack`, `buildHash`, `userAgent`; Docker telemetry uses `from`/`to`.
  - Evidence: `apps/admin-api/app/api/v1/log.py`, `apps/admin-api/app/schemas/docker_telemetry.py`

---

## Auth Scope

- **Bot routes** use `get_admin_or_bot_only` (admin JWT or X-API-Key only); WebApp bearer is rejected on `/api/v1/bot/*`.
- Routes that allow WebApp (e.g. app_settings) use `get_admin_or_bot` (admin, bot, or WebApp).
  - Evidence: `apps/admin-api/app/core/bot_auth.py`, `apps/admin-api/app/api/v1/bot.py`
