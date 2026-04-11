# VPN Suite

**AmneziaWG cluster control plane and Telegram sales gateway:** admin panel, Telegram Mini App, node sync, telemetry, payments (Telegram Stars).

[![CI](https://github.com/alexandertataurov/vpn-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandertataurov/vpn-suite/actions/workflows/ci.yml)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Quick start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API & docs](#api--docs)
- [Repository structure](#repository-structure)
- [Stack](#stack)
- [Contributing](#contributing)

---

## Overview

VPN Suite runs the control plane for **AmneziaWG** (WireGuard-compatible) VPN nodes and a **Telegram bot** for signup, subscriptions (Telegram Stars), device issuance, and a **Telegram Mini App** for self-service. It targets technically capable homelab / small-ops operators who want one dashboard for servers, devices, telemetry, and billing.

- **Production stack:** AmneziaWG + **node-agent** on each VPN host; Outline integration has been removed.
- **Release status:** Public Beta. See [docs/marketing/public-beta-launch-outline.md](docs/marketing/public-beta-launch-outline.md) for scope and limitations.

---

## Features

| Area | Description |
|------|-------------|
| **Admin API** | FastAPI: JWT auth, RBAC, audit log; CRUD for servers, users, subscriptions, plans, devices |
| **Admin SPA** | React + Vite: devices, servers, telemetry, operator dashboard, issue/rotate/revoke configs |
| **Telegram Mini App** | Plan, Settings, Support, Server selection, checkout; shared design system |
| **Telegram bot** | Subscription and device management, Telegram Stars, promo/referral |
| **Node sync** | Agent mode (node-agent per host) or docker mode (single-host); server sync, reconcile, drift |
| **Observability** | Structured logs (request_id), Prometheus metrics, optional Loki/Tempo/OTEL |
| **Backup/restore** | Postgres and Redis procedures in [docs/ops/runbook.md](docs/ops/runbook.md) |

---

## Quick start

```bash
cp .env.example .env
# Edit .env: PUBLIC_DOMAIN, POSTGRES_PASSWORD, SECRET_KEY, ADMIN_EMAIL/ADMIN_PASSWORD, AGENT_SHARED_TOKEN (if agent mode)

./manage.sh up-core
```

- **Admin:** `https://<PUBLIC_DOMAIN>/admin`
- **API:** `https://<PUBLIC_DOMAIN>/api/v1`

**One-command bring-up (agent mode):**

```bash
# Optional: set DOCKER_GID if node-agent needs Docker (getent group docker)
./manage.sh bootstrap
```

---

## Installation

- **Requirements:** Docker and Docker Compose, Bash. For agent mode: `DOCKER_GID` on nodes.
- **First install (Ubuntu LTS):** [docs/ops/install-ubuntu-lts.md](docs/ops/install-ubuntu-lts.md)
- **Secrets and env:** [docs/ops/required-secrets.md](docs/ops/required-secrets.md)
- **Production:** Use `NODE_DISCOVERY=agent` and `NODE_MODE=agent`; run node-agent on each VPN host via `./manage.sh up-agent`. See [docs/ops/agent-mode-one-server.md](docs/ops/agent-mode-one-server.md).
- **Hardening (Ubuntu LTS):** [docs/ops/hardening-reference-ubuntu.md](docs/ops/hardening-reference-ubuntu.md)

---

## Configuration

| Variable | Description |
|----------|-------------|
| `PUBLIC_DOMAIN` | Hostname for admin and API (default: localhost) |
| `POSTGRES_PASSWORD` | Required; DB password |
| `SECRET_KEY` | Required; app secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin bootstrap login |
| `NODE_MODE` | `mock` \| `real` \| `agent`; production: `agent` |
| `NODE_DISCOVERY` | `docker` \| `agent`; production: `agent` |
| `AGENT_SHARED_TOKEN` | Required when using agent (≥32 chars) |
| `BOT_TOKEN` / `TELEGRAM_BOT_TOKEN` | Required if running bot |
| `TELEGRAM_STARS_WEBHOOK_SECRET` | For payment webhooks |

Full list: [docs/ops/required-secrets.md](docs/ops/required-secrets.md).

---

## Usage

| Command | Description |
|---------|-------------|
| `./manage.sh bootstrap` | Core + migrate + seed + seed-agent-server + node-agent |
| `./manage.sh up-core` | Start admin-api, postgres, redis, reverse-proxy, bot |
| `./manage.sh up-monitoring` | Prometheus, Grafana, Loki, etc. |
| `./manage.sh up-agent` | Start node-agent (needs DOCKER_GID) |
| `./manage.sh down-core` | Stop core (preserves DB volumes) |
| `./manage.sh migrate` | Run Alembic migrations |
| `./manage.sh seed` | Seed admin, plans, system operator |
| `./manage.sh server:verify <id>` | Verify server (node check) |
| `./manage.sh server:sync <id>` | Sync server public key to DB |
| `./manage.sh server:drift <id>` | Show desired vs actual (dry run) |
| `./manage.sh server:reconcile <id>` | Reconcile server |
| `./manage.sh device:reissue <id>` | Reissue device config |
| `./manage.sh check` | Quality gate (ruff, pytest, frontend lint/typecheck/test/build) |
| `./manage.sh verify` | Full gate (migrate integrity, config-validate) |
| `./manage.sh smoke-staging` | End-to-end validation |
| `./manage.sh backup-db` | Postgres backup to backups/postgres/ |
| `./manage.sh openapi` | Export OpenAPI to openapi/openapi.yaml |
| `./manage.sh support-bundle` | Bounded logs and manifest for support |

`STRICT=1` makes optional step failures fatal.

---

## API & docs

- **OpenAPI:** `openapi/openapi.yaml` (generate with `./manage.sh openapi`)
- **API overview and auth:** [docs/api/overview.md](docs/api/overview.md)
- **Domain model:** [docs/api/domain-model.md](docs/api/domain-model.md)
- **Current architecture and backlog program:** [docs/specs/as-built-architecture.md](docs/specs/as-built-architecture.md), [docs/specs/target-architecture.md](docs/specs/target-architecture.md), [docs/backlog/spec-delivery-program.md](docs/backlog/spec-delivery-program.md)
- **Doc index:** [docs/README.md](docs/README.md) — guides (ops, observability, development), runbook, local dev, codebase map
- **Miniapp Storybook contract:** [docs/storybook-ai-contract.md](docs/storybook-ai-contract.md), [docs/ai-ui-workflow.md](docs/ai-ui-workflow.md), and [docs/frontend/storybook/README.md](docs/frontend/storybook/README.md)

---

## Repository structure

| Path | Purpose |
|------|---------|
| `apps/admin-api/` | FastAPI control-plane API, auth, device issue, telemetry, payments |
| `apps/admin-web/` | Admin SPA (devices, servers, users, telemetry, billing) |
| `apps/miniapp/` | Telegram Mini App (Plan, Settings, Support, Server selection) |
| `apps/shared-web/` | Shared frontend types and utilities |
| `apps/telegram-bot/` | Telegram bot (aiogram) |
| `apps/node-agent/` | AmneziaWG node reconciler |
| `manage.sh` | Ops CLI; see [Usage](#usage) |
| `docs/` | Guides, runbook, API, specs |

**pnpm workspace** (root `pnpm run lint` / `build` / etc.): [`apps/admin-web`](apps/admin-web), [`apps/miniapp`](apps/miniapp), [`apps/shared-web`](apps/shared-web) — see [`pnpm-workspace.yaml`](pnpm-workspace.yaml). Python apps (`admin-api`, `telegram-bot`, `node-agent`) use their own tooling and `./manage.sh`.

Detailed map: [docs/codebase-map.md](docs/codebase-map.md#monorepo-boundaries) (including monorepo boundaries).

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, Python 3.12, PostgreSQL (async), Redis |
| Frontend | React 18, TypeScript, Vite 6, TanStack Query 5 |
| Bot | Python 3.12, aiogram 3 |
| Node agent | Python 3.12 |
| Proxy | Caddy (TLS, static frontends, mTLS for agent) |

---

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) — design-system contract (tokens, components, Storybook), PR checklist, guardrails.

For agents and automation: [AGENTS.md](AGENTS.md).

### Storybook contract commands

- `pnpm run storybook:contract:miniapp` verifies the required executable Storybook contract stories and tags.
- `pnpm run test-storybook:miniapp` runs the required reduced Storybook contract suite.
- `pnpm run test-storybook:official:miniapp` probes the standalone official Storybook runner. This is non-blocking until the current Storybook 10 metadata issue is resolved.
