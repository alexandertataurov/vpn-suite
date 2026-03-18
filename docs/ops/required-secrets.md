# Required Secrets

**Single source of truth:** repo-root `.env`. Override with `ENV_FILE=...` if needed. `secrets/` holds only mTLS certs/keys (see `secrets/README.md`).

## Always Required (docker-compose / core)

| Variable | Purpose |
|----------|---------|
| PUBLIC_DOMAIN | Reverse-proxy hostname (e.g. localhost, vpn.example.com) |
| POSTGRES_PASSWORD | Postgres password |
| GRAFANA_ADMIN_PASSWORD | Grafana (monitoring profile) |
| ALERTMANAGER_IMAGE | Alertmanager image tag (required by compose) |

## Required for Admin API (backend)

| Variable | Purpose |
|----------|---------|
| VPN_DEFAULT_HOST | Optional. Host clients use for VPN (e.g. vpn.example.com). When set, Issue Config auto-derives endpoint as host:listen_port. Defaults to PUBLIC_DOMAIN when unset. |
| DATABASE_URL | Async Postgres connection string |
| REDIS_URL | Redis connection (use redis://:password@redis:6379/0 when REDIS_PASSWORD set) |
| REDIS_PASSWORD | Optional; set in production to enable Redis requirepass |
| SECRET_KEY | JWT/session signing (min 32 chars) |
| ADMIN_EMAIL | Initial admin seed |
| ADMIN_PASSWORD | Initial admin seed (min 12 chars in prod) |

## Required for Bot

| Variable | Purpose |
|----------|---------|
| BOT_TOKEN | Bot token (Telegram) |
| BOT_API_KEY | Internal API key for bot (if used) |
| BOT_USERNAME / VITE_TELEGRAM_BOT_USERNAME | Bot @username without @. Referral links require it: Compose passes VITE_* to admin-api as TELEGRAM_BOT_USERNAME; without Compose, set TELEGRAM_BOT_USERNAME or rely on backend fallback to VITE_TELEGRAM_BOT_USERNAME. |
| SUPPORT_HANDLE | Support handle (e.g. @support) |
| SUPPORT_LINK | Optional deep link for support |

## Required in Production (validate_production_secrets)

| Variable | Min Length |
|----------|------------|
| SECRET_KEY | 32 |
| ADMIN_PASSWORD | 12 |
| BAN_CONFIRM_TOKEN | 16 |
| BLOCK_CONFIRM_TOKEN | 16 |
| RESTART_CONFIRM_TOKEN | 16 |
| REVOKE_CONFIRM_TOKEN | 16 |
| AGENT_SHARED_TOKEN | 32 (when NODE_MODE=agent or NODE_DISCOVERY=agent) |

## Required for Observability Compose (docker-compose.observability.yml)

| Variable | Purpose |
|----------|---------|
| VICTORIA_METRICS_IMAGE | VictoriaMetrics image tag |
| TEMPO_IMAGE | Tempo image tag |
| OTEL_COLLECTOR_IMAGE | OpenTelemetry Collector image tag |
| AWS_CLI_IMAGE | AWS CLI image tag (archive jobs) |

## Node-Agent (per-node env, e.g. amnezia/amnezia-awg2/secrets/node.env)

| Variable | Purpose |
|----------|---------|
| CONTROL_PLANE_URL | https://$PUBLIC_DOMAIN:8443 |
| SERVER_ID | Server ID from control-plane |
| AGENT_SHARED_TOKEN | Must match control-plane |

## Troubleshooting

### Referral: "Bot username missing"

If the miniapp shows "Referral links are unavailable: bot username is not configured":

1. **Env:** Ensure `.env` has `VITE_TELEGRAM_BOT_USERNAME=YourBot` (no `@`).
2. **Backend:** Recreate the container so it gets env: `docker compose up -d --force-recreate admin-api`.
3. **Miniapp build:** Rebuild from repo root so build-time env is set: `cd frontend && pnpm run build:miniapp`.
4. **Check backend:** `curl -s http://localhost:8000/health` (or your API origin) and confirm `referral_configured: true`.
5. **Stale cache:** Hard-refresh the miniapp or clear site data; the page will also refetch the referral link once when it sees empty bot username (cache bust).
