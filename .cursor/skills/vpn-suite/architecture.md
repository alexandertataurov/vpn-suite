# VPN Suite – Architecture

## Service layout and profiles

- **Core (default):** admin-api, postgres, redis, reverse-proxy, telegram-vpn-bot.
- **Agent (optional):** node-agent — runs on each VPN host; heartbeat + reconcile with control-plane.
- **Monitoring (optional):** `docker-compose.observability.yml` or profile — Prometheus, Loki, Tempo, OTEL collector, Grafana, etc. Config in `config/monitoring/`.

## Data flow

- **User → Bot:** Telegram → telegram-vpn-bot (webhooks, mini-app).
- **Bot / Admin SPA → Control-plane:** HTTPS to reverse-proxy → admin-api (FastAPI); JWT auth, RBAC.
- **Admin-api:** Postgres (source of truth), Redis (FSM, rate limit, queues). Node runtime: discovery/reconcile via Docker or agent.
- **Node-agent:** Registers with admin-api, heartbeat, pulls desired state, reconciles AmneziaWG/WireGuard on the host (docker exec or native).
- **Monitoring:** Prometheus scrapes admin-api/node-agent and optional exporters; Loki/Promtail for logs; Grafana dashboards.

## Control plane

- **CLI:** `manage.sh` — config, up-core, up-monitoring, bootstrap, up-agent, migrate, seed*, server:*, device:reissue, check, verify, smoke-staging, backup-db, openapi, support-bundle. Use as the single ops interface.
- **Production:** Use `NODE_DISCOVERY=agent` and `NODE_MODE=agent`; run node-agent on each VPN host. Docker discovery is not allowed when `ENVIRONMENT=production`.

## Internal DNS

Containers resolve service names via Docker network (e.g. admin-api, postgres, redis). Use service names in env (e.g. `DATABASE_URL` with host `postgres`), never localhost for inter-service calls.

## Key paths

| Path | Purpose |
|------|---------|
| `backend/` | admin-api (FastAPI, app/main.py, app/api/v1/*) |
| `frontend/admin/` | Admin SPA (React, Vite) |
| `frontend/miniapp/` | Telegram Mini App |
| `bot/` | Telegram bot (aiogram) |
| `node-agent/` | Node reconciler |
| `docker/reverse-proxy/` | Caddy |
| `config/caddy/`, `config/monitoring/`, `config/redis/` | Service configs |

## References

- Full layout: [docs/codebase-map.md](../../docs/codebase-map.md)
- Runbook: [docs/ops/runbook.md](../../docs/ops/runbook.md)
- Agent mode: [docs/ops/agent-mode-one-server.md](../../docs/ops/agent-mode-one-server.md)
