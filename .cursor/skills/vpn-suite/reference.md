# VPN Suite – Conventions Reference

## API response format (standardized JSON)

Success:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "timestamp": "2025-02-11T12:00:00Z" }
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "USER_NOT_FOUND", "message": "Human-readable message" },
  "meta": { "code": 404, "message": "Not Found", "timestamp": "2025-02-11T12:00:00Z" }
}
```

- `success`: boolean. `data`: payload when ok. `error`: null when success; else `{ "code", "message" }`.
- `meta`: include `timestamp` (ISO 8601); optional `code`/`message` for HTTP-level info.

## Error codes and messages

- Stable string codes (e.g. `USER_NOT_FOUND`, `INVALID_API_KEY`, `AUTH_REQUIRED`).
- Never expose stack traces to clients; log full context server-side.
- Document new codes in API docs or this reference when they affect multiple components.

## Logging

- **Format**: Structured (JSON preferred). Include: timestamp, service name, level, message; use correlation IDs where useful.
- **Levels**: ERROR, WARN, INFO, DEBUG (use consistently).
- **Never log**: passwords, API keys, tokens, VPN keys.
- **Server-side**: Log full context for debugging; keep logs out of client responses.

## Database

- **Postgres (admin-api):** Primary store; snake_case tables/columns. Migrations in `apps/admin-api/` (Alembic or project convention); keep reversible where possible.
- **Redis:** FSM, rate limit, queues, ephemeral state; no persistent schema.
- **Backups:** Before migrations or rollouts run `./manage.sh backup-db`; see [docs/ops/runbook.md](../../docs/ops/runbook.md).

## Healthchecks

- Every service must have a Docker healthcheck in compose.
- **admin-api:** readiness/liveness endpoints as defined in app (e.g. `/health` or `/ready`).
- **Bot:** `GET /healthz` (or as configured) → 200 OK when ready.
- **node-agent:** health endpoint as implemented; control-plane may use it for topology.
- **Monitoring:** Use built-in endpoints (e.g. Prometheus `/-/healthy`, Grafana `/api/health`).
- New services: add healthcheck so `depends_on` can use `condition: service_healthy` where appropriate.

## Docker image naming and versioning

- Prefer project-scoped names or keep existing (amnezia-awg, etc.). Volumes: component prefix + purpose (e.g. `amnezia_db_data`).
- Pin base image tags where possible; for built images, consider tags from git or build date.

## AmneziaWG client config (issue device)

- Issued config uses real WireGuard keypairs (X25519, base64) and AmneziaWG obfuscation (Jc, Jmin, Jmax, S1, S2, H1–H4).
- **Server**: Set `public_key` (server’s WG public key) and `vpn_endpoint` (VPN host:port, e.g. `vpn.example.com:47604`) so the client config includes Endpoint.
- **Server profile** `request_params` (JSONB) can override or supply:
  - `client_endpoint` — VPN host:port if not set on server.
  - `amnezia_jc`, `amnezia_jmin`, `amnezia_jmax` — junk-train params (defaults: 4, 64, 1024).
  - `amnezia_s1`, `amnezia_s2` — handshake length prefixes (must match server; default 0).
  - `amnezia_h1`–`amnezia_h4` — header modification (must match server).
  - `dns` — DNS string or list for Interface.
- Without obfuscation params the config is WireGuard-compatible; with them it is AmneziaWG 1.5.

## Node contract (create_peer / key verification)

- **Agent mode:** node-agent manages peers on the host; control-plane sends desired state; issuance uses live server key from heartbeat. If server key not in DB → 409 `SERVER_NOT_SYNCED`; run `./manage.sh server:sync <server_id>`.
- **Docker mode (legacy):** issue device uses Docker runtime to add peer on node (e.g. `docker exec` wg/awg). Node must accept peer add and return success so device is not left without a peer.

## Security

- No credentials in docker-compose.yml, Dockerfiles, or git. Use `.env` (gitignored); secrets as env vars or mounted files at runtime.
- Least privilege: only `amnezia-awg` gets privileged and NET_ADMIN/SYS_MODULE.
- **Docker socket**: Do not expose the Docker socket to the control plane API or to the front; use it only from the host or a trusted service that runs `docker exec` for node discovery/control (OWASP).
- **Logging**: Never log private keys; redaction covers Bearer, password-like, and PrivateKey/private_key values. Exec command args are from controlled sources only (no user string concatenation).
