# VPN Suite

AmneziaWG cluster control plane + Telegram sales gateway. Admin panel, node sync, telemetry, payments.

## Quick Start

```bash
cp .env.example .env
# Edit .env: set PUBLIC_DOMAIN, POSTGRES_PASSWORD, AGENT_SHARED_TOKEN, etc.

./manage.sh up-core
# Admin: https://<PUBLIC_DOMAIN>/admin
# API: https://<PUBLIC_DOMAIN>/api/v1
```

**Agent mode (one-command bring-up):**

```bash
# Optional: set DOCKER_GID if node-agent cannot access Docker (getent group docker).
# Bootstrap: core + migrate + seed + agent server + node-agent (idempotent).
./manage.sh bootstrap
```

## Key Commands

| Command | Description |
|---------|-------------|
| `./manage.sh bootstrap` | Core + migrate + seed + seed-agent-server + node-agent (agent mode) |
| `./manage.sh up-core` | Start admin-api, postgres, redis, reverse-proxy, bot |
| `./manage.sh up-agent` | Start node-agent (profile agent; needs DOCKER_GID for docker.sock) |
| `./manage.sh server:drift <server_id>` | Show desired vs actual diff (dry run); in agent mode prints where to check |
| `./manage.sh server:reconcile <server_id>` | Reconcile server (agent: queues action via admin API; docker: runs node_ops) |
| `./manage.sh device:reissue <device_id>` | Reissue device config (API_TOKEN or ADMIN_EMAIL/ADMIN_PASSWORD); fails if server key unverified |
| `./manage.sh check` | Quick quality gate (ruff, pytest, frontend lint/typecheck/test/build) |
| `./manage.sh verify` | Full quality gate (includes migrate integrity, config-validate) |
| `./manage.sh smoke-staging` | End-to-end validation (tests, E2E, API smoke) |

**Strict mode:** `STRICT=1` makes any optional step failure fatal (default: permissive, optional failures reported). Composite commands (`rebuild-restart`, `bootstrap`, `restart-metrics`, `restart-audit`) print a subsystem summary (✅ core/audit/observability/agent up or ⚠️ failed with stderr). Exit non-zero if a required step failed or if `STRICT=1` and any optional step failed.

## Docs

- [docs/guides/](docs/guides/README.md) — consolidated guides (ops, observability, development)
- [AGENTS.MD](AGENTS.MD) — architecture, constraints, API
- [docs/README.md](docs/README.md) — full doc index

## Stack

- **Backend:** FastAPI, Python 3.12, Postgres, Redis
- **Frontend:** React 18, TypeScript, Vite 6, TanStack Query 5
- **Bot:** Python (aiogram)
