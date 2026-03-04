# VPN Suite

> AmneziaWG cluster control plane and Telegram sales gateway: admin panel, node sync, telemetry, payments.

[![CI](https://github.com/alexandertataurov/vpn-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandertataurov/vpn-suite/actions/workflows/ci.yml)

## Overview

VPN Suite runs the control plane for AmneziaWG (WireGuard-compatible) VPN nodes and a Telegram bot for user signup, subscriptions (Telegram Stars), and device issuance. It targets a **technically capable homelab / small-ops operator** who wants a single dashboard for servers, devices, telemetry, and billing rather than a generic consumer VPN.

> **Release status:** Public Beta for homelab / power users running their own AmneziaWG/WireGuard clusters. See [docs/marketing/public-beta-launch-outline.md](docs/marketing/public-beta-launch-outline.md) for launch plan, current limitations, and who this is *not* for.

## Features

- **Admin API (FastAPI):** JWT auth, RBAC, audit log, CRUD for servers, users, subscriptions, plans, devices
- **Admin SPA:** React + Vite; devices, servers, telemetry, operator dashboard, issue/rotate/revoke configs
- **Telegram bot:** Subscription and device management, Telegram Stars payments, promo/referral
- **Node sync:** Agent mode (node-agent on each VPN host) or docker mode (single-host); server sync, reconcile, drift
- **Observability:** Structured logs (request_id), Prometheus metrics, optional Loki/Tempo/OTEL
- **Backup/restore:** Postgres and Redis procedures in runbook

## Quick Start

```bash
cp .env.example .env
# Edit .env: set PUBLIC_DOMAIN, POSTGRES_PASSWORD, AGENT_SHARED_TOKEN (if agent mode)

./manage.sh up-core
```

- Admin: `https://<PUBLIC_DOMAIN>/admin`
- API: `https://<PUBLIC_DOMAIN>/api/v1`

**Agent mode (one-command bring-up):**

```bash
# Optional: set DOCKER_GID if node-agent needs Docker (getent group docker)
./manage.sh bootstrap
```

## Installation

- **Requirements:** Docker and Docker Compose, Bash. For agent mode: `DOCKER_GID` on nodes.
- **First install (Ubuntu LTS, single-node control plane):** [docs/ops/install-ubuntu-lts.md](docs/ops/install-ubuntu-lts.md)
- **Clone and configure:** Copy `.env.example` to `.env`, set required variables (see [Configuration](#configuration)).
- **Start core:** `./manage.sh up-core`. Optional: `./manage.sh up-monitoring` for Prometheus/Grafana/Loki.
- **Migrations and seed:** `./manage.sh migrate`, `./manage.sh seed` (and `./manage.sh seed-agent-server` if using agent).
- **Hardening baseline (Ubuntu LTS reference):** [docs/ops/hardening-reference-ubuntu.md](docs/ops/hardening-reference-ubuntu.md)
- **Production:** Use `NODE_DISCOVERY=agent` and `NODE_MODE=agent`; run node-agent on each VPN host via `./manage.sh up-agent`. See [docs/ops/agent-mode-one-server.md](docs/ops/agent-mode-one-server.md).

## Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PUBLIC_DOMAIN` | string | localhost | Public hostname for admin and API |
| `POSTGRES_PASSWORD` | string | — | Required; DB password |
| `SECRET_KEY` | string | — | Required; app secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | string | — | Admin bootstrap login |
| `NODE_MODE` | enum | agent | `mock` \| `real` \| `agent`; production: `agent` |
| `NODE_DISCOVERY` | enum | agent | `docker` \| `agent`; production: `agent` |
| `AGENT_SHARED_TOKEN` | string | — | Required when NODE_MODE=agent or NODE_DISCOVERY=agent (≥32 chars) |
| `DATABASE_URL` | string | — | Postgres URL (default from POSTGRES_* in .env.example) |
| `REDIS_URL` | string | — | Redis URL |
| `TELEMETRY_PROMETHEUS_URL` | string | — | Optional; e.g. http://prometheus:9090 for dashboard metrics |
| `BOT_TOKEN` / `TELEGRAM_BOT_TOKEN` | string | — | Required if running bot |
| `TELEGRAM_STARS_WEBHOOK_SECRET` | string | — | For payment webhooks |

Full list and production secrets: [docs/ops/required-secrets.md](docs/ops/required-secrets.md).

## Usage

| Command | Description |
|---------|-------------|
| `./manage.sh bootstrap` | Core + migrate + seed + seed-agent-server + node-agent (agent mode) |
| `./manage.sh up-core` | Start admin-api, postgres, redis, reverse-proxy, bot |
| `./manage.sh up-agent` | Start node-agent (profile agent; needs DOCKER_GID) |
| `./manage.sh server:verify <server_id>` | Verify server (node check) |
| `./manage.sh server:sync <server_id>` | Sync server public key to DB |
| `./manage.sh server:drift <server_id>` | Show desired vs actual diff (dry run) |
| `./manage.sh server:reconcile <server_id>` | Reconcile server |
| `./manage.sh device:reissue <device_id>` | Reissue device config (fails if server key unverified) |
| `./manage.sh check` | Quality gate (ruff, pytest, frontend lint/typecheck/test/build) |
| `./manage.sh verify` | Full gate (migrate integrity, config-validate) |
| `./manage.sh smoke-staging` | End-to-end validation |
| `./manage.sh backup-db` | Postgres backup to backups/postgres/ |
| `./manage.sh openapi` | Export OpenAPI to openapi/openapi.yaml |

**Strict mode:** `STRICT=1` makes any optional step failure fatal.

## API Reference

- **OpenAPI:** `openapi/openapi.yaml` (generate with `./manage.sh openapi`)
- **Overview and auth:** [docs/api/overview.md](docs/api/overview.md)
- **Domain model:** [docs/api/domain-model.md](docs/api/domain-model.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for design-system contract (tokens, components, Storybook), PR checklist, and guardrails.

## Docs

- [docs/README.md](docs/README.md) — full doc index
- [docs/guides/](docs/guides/README.md) — ops, observability, development guides
- [docs/ops/runbook.md](docs/ops/runbook.md) — production runbook (start/stop, backups, troubleshooting)
- [AGENTS.MD](AGENTS.MD) — architecture and constraints (for agents)

## Stack

- **Backend:** FastAPI, Python 3.12, Postgres, Redis
- **Frontend:** React 18, TypeScript, Vite 6, TanStack Query 5
- **Bot:** Python (aiogram)
