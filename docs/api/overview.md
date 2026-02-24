# API Overview

Base URL: `https://$PUBLIC_DOMAIN` (or `http://localhost:8000` in dev).

Agent (mTLS): `https://$PUBLIC_DOMAIN:8443/api/v1/agent/*` (client cert + `X-Agent-Token`).

OpenAPI (canonical): `docs/api/openapi.yaml` (generated from code + post-processed to include compat aliases).

---

## Where to Look

- **Single source of truth:** `docs/api/README.md`
- **Current surface (code truth):** `docs/api/current-surface.md`
- **OpenAPI:** `openapi/openapi.yaml` (exported) and `docs/api/openapi.yaml` (canonical)

---

## High-Level Groups

- **Auth:** `/api/v1/auth/*` (admin JWT + refresh tokens)
- **Admin API (JWT):** `/api/v1/*` (cluster, servers, devices, users, payments, etc.)
- **Bot API (X-API-Key):** `/api/v1/bot/*`
- **WebApp API (Bearer session):** `/api/v1/webapp/*`
- **Agent API (mTLS + X-Agent-Token):** `/api/v1/agent/*`
- **Observability:** `/metrics`, `/health`, `/health/ready`
- **Webhooks:** `/webhooks/*` (provider-specific secret header)

---

## Note on Compatibility Aliases

`/api/telemetry/docker/*` is a compatibility alias for `/api/v1/telemetry/docker/*` (deprecated but still implemented). See `docs/api/versioning-audit.md` for details.
