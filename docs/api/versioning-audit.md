# Versioning & Backward Compatibility Audit

---

## HTTP Versioning Model

- **Primary versioning:** `/api/v1/*`
  - Evidence: `backend/app/main.py` router prefixes.

- **Compatibility alias (deprecated):** `/api/telemetry/docker/*`
  - Implemented via a second router include with `include_in_schema=False`.
  - Evidence: `backend/app/main.py`.

- **Non-versioned endpoints:**
  - `/webhooks/*` (payment providers)
  - `/metrics`, `/health`, `/health/ready`

---

## Agent API Versioning

- Agent endpoints are under `/api/v1/agent/*` plus `/api/v1/agent/v1/*` (inner version for agent protocol).
  - Evidence: `backend/app/api/v1/agent.py`.

---

## gRPC Versioning

- gRPC package: `vpnsuite.agent.v1`
  - Evidence: `proto/node_agent.proto`.

---

## Compatibility Notes

- `/api/telemetry/docker/*` is a compatibility alias for `/api/v1/telemetry/docker/*` and is marked **deprecated** in the canonical OpenAPI.
- No other explicit deprecation headers or version headers are present in code.

---

## Recommendations (Non-breaking)

- Keep `/api/telemetry/docker/*` as deprecated alias until all clients migrate.
- Consider consolidating agent protocol versioning (avoid double `v1` in paths if possible).
