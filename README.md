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
| `./manage.sh check` | Quick quality gate (ruff, pytest, frontend lint/typecheck/test/build) |
| `./manage.sh verify` | Full quality gate (includes migrate integrity, config-validate) |
| `./manage.sh smoke-staging` | End-to-end validation (tests, E2E, API smoke) |

## Docs

- [AGENTS.MD](AGENTS.MD) — architecture, constraints, API
- [docs/audits/release-readiness-report.md](docs/audits/release-readiness-report.md) — audit, scores, commands
- [docs/ops/runbook.md](docs/ops/runbook.md) — ops, troubleshooting, backups

## Stack

- **Backend:** FastAPI, Python 3.12, Postgres, Redis
- **Frontend:** React 18, TypeScript, Vite 6, TanStack Query 5
- **Bot:** Python (aiogram)
