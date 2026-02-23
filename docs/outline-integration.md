# Outline VPN Manager integration

VPN Suite Admin can connect to a running Outline (Shadowbox) instance.

## Critical: Deployment Target

**NEVER run the Outline installer on a local Mac or dev workstation.**  
Outline MUST be installed on the production server (the host that users will connect to). If you run the installer locally, `access.txt` will contain `localhost` or a private IP, and integration will fail.

- **Correct:** SSH to production server → run Outline installer there → copy `access.txt` to `/opt/outline/`
- **Wrong:** Run Outline installer on Mac → copy `access.txt` (contains localhost)

Before importing: run `./scripts/validate-outline-access.sh` to reject localhost/private hosts. to manage access keys (Shadowsocks) from the dashboard. Outline is used as an access/key manager; AmneziaWG remains the transport stack for WG traffic.

## API summary

- **Source**: [Jigsaw-Code/outline-server api.yml](https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml) (OpenAPI 3.0.1).
- **Auth**: No header. The base URL includes the secret path: `https://myserver/SecretPath`. All requests use this URL; the path acts as the API key. Never log or expose the full URL.

### Endpoints used

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/server` | Server info (name, version, hostnameForAccessKeys, portForNewAccessKeys, etc.) |
| GET | `/access-keys` | List access keys |
| POST | `/access-keys` | Create key (body: name?, method?, password?, port?, limit?) |
| GET | `/access-keys/{id}` | Get one key |
| PUT | `/access-keys/{id}/name` | Rename key (body: name) |
| DELETE | `/access-keys/{id}` | Delete key |
| GET | `/metrics/transfer` | Bytes transferred per key (bytesTransferredByUserId) |
| GET | `/metrics/enabled` | Whether metrics are shared |
| GET | `/experimental/server/metrics` | Per-key tunnel time, data, lastTrafficSeen (optional) |

## Network and validation checklist

1. **Outline Manager + Shadowbox** must be running and reachable from the admin-api container (same network or routable).
2. **Backend can call** either:
   - Internal: direct to Outline host (e.g. `http://outline-host:8081/SecretPath`), or
   - Via Caddy: `https://PUBLIC_DOMAIN/outline-api/` (Caddy rewrites path using `OUTLINE_API_SECRET_PATH`).
3. **Env**: Set `OUTLINE_MANAGER_URL` to the full URL including secret path. Never return this to the frontend; only a masked value (e.g. `https://***/outline-api/`) for the connection card.
4. **Caddy**: Ensure `OUTLINE_UPSTREAM` and `OUTLINE_API_SECRET_PATH` match your Outline access (e.g. from `/opt/outline/access.txt`).
5. **Test**: Use "Test connection" in Admin → Settings → Integrations → Outline to verify `GET /server` succeeds.

## Enable and rollout

1. **Migration**: Run `./manage.sh migrate` (or `alembic upgrade head` in backend) to add `devices.outline_key_id`.
2. **Env**: Set `OUTLINE_MANAGER_URL` (full URL with secret path). Set `OUTLINE_INTEGRATION_ENABLED=true` (default). Optional: `OUTLINE_REQUEST_TIMEOUT_SECONDS`, `OUTLINE_RETRY_COUNT`.
3. **Permissions**: Admin role with `*` already has access. For custom roles, add `outline:read` and `outline:write`.
4. **UI**: Admin → Settings → Integrations → Outline. Test connection, then create/list/revoke keys.
5. **Rollout**: Enable in staging first; monitor logs and `POST /log/frontend-error` for errors.

## AWG ↔ Outline relationship

- Outline (Shadowsocks) and AmneziaWG are **different stacks**. In this deployment Outline is used for key distribution and Shadowsocks access; AWG is separate unless a concrete bridge exists.
- If the same machine runs both: document shared firewall/ports. If not: document how clients choose Outline vs AWG (e.g. different apps/configs).
