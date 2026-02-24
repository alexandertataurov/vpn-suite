# Authentication & Authorization Audit

This audit maps **actual** auth enforcement in code + runtime config.

---

## Auth Mechanisms In Use

1. **Admin JWT (Bearer)**
   - Dependency: `get_current_admin` / `require_permission` / `require_audit_read`.
   - Evidence: `backend/app/api/v1/auth.py`, `backend/app/core/rbac.py`, `backend/app/core/bot_auth.py`.

2. **Bot API Key (X-API-Key)**
   - Dependency: `get_admin_or_bot` accepts `X-API-Key` and grants BotPrincipal.
   - Evidence: `backend/app/core/bot_auth.py`, `backend/app/api/v1/bot.py`.

3. **WebApp Session (Bearer)**
   - WebApp session token created by `/api/v1/webapp/auth` and validated inside webapp handlers.
   - Evidence: `backend/app/api/v1/webapp.py`, `backend/app/core/security.py`.

4. **Agent API (mTLS + X-Agent-Token)**
   - mTLS enforced at reverse proxy for `/api/v1/agent/*`.
   - X-Agent-Token enforced in API handler via `_require_agent_token`.
   - If `AGENT_SHARED_TOKEN` is empty, agent API returns 503 (disabled).
   - Evidence: `config/caddy/Caddyfile`, `backend/app/api/v1/agent.py`.

5. **Webhook Secret (provider-specific)**
   - Telegram Stars secret header: `X-Telegram-Bot-Api-Secret-Token` if configured.
   - Evidence: `backend/app/api/v1/webhooks.py`, `backend/app/core/config.py`.

6. **Tokenized Config Downloads**
   - `/api/v1/admin/configs/{token}/download` and `/qr` are authenticated by token.
   - Evidence: `backend/app/api/v1/admin_configs.py`.

---

## Auth Enforcement by Path Class

- **Admin-only:** Most `/api/v1/*` endpoints require JWT admin or RBAC permission (`require_permission`, `_check`).
- **Bot/WebApp mix:** `/api/v1/bot/*` uses `get_admin_or_bot` (JWT, X-API-Key, or webapp session).
- **WebApp-only:** `/api/v1/webapp/*` validates webapp session in handler body; `/api/v1/webapp/auth` is public.
- **Agent-only:** `/api/v1/agent/*` requires mTLS + X-Agent-Token.
- **Public (no auth):** `/metrics`, `/health`, `/health/ready`, `/api/v1/log/frontend-error` (rate‑limited), `/webhooks/*` (secret header optional).

---

## RBAC / Permissions

- Permissions are enforced via `require_permission(permission)`.
- Audit read is enforced via `require_audit_read`.
- Evidence: `backend/app/core/rbac.py`, `backend/app/core/bot_auth.py`.

---

## Sensitive Endpoint Review

- **Admin config download** uses one-time tokens rather than JWT.
- **Webhook endpoints** are intentionally unauthenticated but can be protected by provider secret.
- **Public health/metrics** are exposed; ensure they are restricted to internal networks in deployment.

---

## CORS & Rate Limiting

- CORS allowlist is configured via `settings.cors_allow_origins`.
- Global API rate limiting middleware is enabled for all routes.
- Evidence: `backend/app/main.py`, `backend/app/core/rate_limit.py`.
