---
type: project-map
updated: 2026-04-11
---

# Project map

## Overview

**VPN Suite** is a monorepo for an **AmneziaWG (WireGuard-compatible) control plane**, **FastAPI admin API**, **React admin and Telegram Mini App frontends**, **Telegram bot** (sales gateway / Stars), and **node-agent** on VPN hosts for discovery and peer reconciliation. **Docker Compose** (`infra/compose/docker-compose.yml`) plus **`manage.sh`** orchestrate Postgres, Redis, Caddy reverse proxy, monitoring sidecars, and optional node-agent.

## Directory structure

| Path | Purpose |
|------|---------|
| `apps/admin-api/` | FastAPI app (`app/main.py`), SQLAlchemy models, Alembic, API routers under `app/api/v1/`, background worker (`app.worker_main`). |
| `apps/admin-web/` | React + Vite admin SPA (`src/main.tsx`, `App`), TanStack Query, Storybook. |
| `apps/miniapp/` | Telegram Mini App (React + Vite), design system, Playwright e2e. |
| `apps/shared-web/` | Shared TS types, hooks, formatting, `@vpn-suite/shared` package consumed by admin + miniapp. |
| `apps/telegram-bot/` | aiogram bot (`main.py`), handlers, aiohttp webhook/metrics, calls admin API. |
| `apps/node-agent/` | Host agent (`agent.py`): Docker + `awg` reconcile, mTLS to control plane, Prometheus metrics. |
| `infra/` | Compose files, Caddy, monitoring configs, Redis, scripts, PKI helpers. |
| `docs/` | Ops, API, specs, marketing, codebase map. |
| `mcp-servers/` | Local MCP (Obsidian vault + project filesystem) for Cursor; Node TS. |
| `tools/` | Quality gates, validators. |
| `vault/` | Obsidian task/journal/spec notes (this vault). |
| `.cursor/`, `.agents/` | Editor rules, skills, hooks. |
| Root | `manage.sh`, `pnpm` workspace, `eslint.config.js`, OpenAPI export, CI. |

## Entry points

| File | Purpose | How to run |
|------|---------|------------|
| `apps/admin-api/app/main.py` | FastAPI ASGI app, mounts `/api/v1` routers, metrics, lifespan. | Docker: `admin-api` service; local: `uvicorn` per Dockerfile/README. |
| `apps/admin-api/app/worker_main.py` | Background worker process. | Compose: `admin-worker` service. |
| `apps/admin-web/src/main.tsx` | Admin SPA bootstrap (Router, QueryClient, ApiProvider). | `pnpm dev:admin` or static via Caddy. |
| `apps/miniapp/src/main.tsx` | Miniapp bootstrap, telemetry. | `pnpm dev:miniapp` or `dist` via Caddy `/webapp`. |
| `apps/telegram-bot/main.py` | Bot + aiohttp (webhook/health/metrics). | Compose `telegram-vpn-bot` or `python main.py` with env. |
| `apps/node-agent/agent.py` | Node agent HTTP server + reconcile loop. | `./manage.sh up-agent` (profile `agent`). |
| `infra/compose/docker-compose.yml` | Core + monitoring + agent profiles. | `./manage.sh up-core` / `up-monitoring` / `up-agent`. |
| `manage.sh` | Single ops CLI (compose, migrate, seed, smoke, backups). | `./manage.sh <cmd>` |

## Modules

### apps/admin-api

- **Purpose:** Control plane REST API, JWT auth, RBAC, devices/servers/subscriptions/plans, agent ingress, webhooks, telemetry, OpenTelemetry.
- **Key files:** `app/main.py` (router wiring), `app/core/config.py` (`Settings`), `app/models/*.py`, `app/api/v1/*.py`, `alembic/`, `scripts/`.
- **Exposes:** HTTP `/api/v1/*`, `/health`, Prometheus metrics; programmatic services under `app/services/`.
- **Depends on:** PostgreSQL, Redis, Docker socket (WG/node ops), optional OTLP.

### apps/admin-web

- **Purpose:** Operator admin UI (devices, servers, billing, telemetry).
- **Key files:** `src/main.tsx`, `src/App.tsx`, `src/core/api/`, routes under `src/app/`.
- **Exposes:** Static SPA built to `dist/`, served under `/admin` by Caddy.
- **Depends on:** `@vpn-suite/shared`, Admin API (`VITE_*` / proxy).

### apps/miniapp

- **Purpose:** End-user Telegram Web App (plans, settings, support, checkout).
- **Key files:** `src/main.tsx`, `src/app/App.tsx`, design-system under `src/design-system/`.
- **Exposes:** Static build to `dist/` at `/webapp`.
- **Depends on:** `@vpn-suite/shared`, Admin API.

### apps/shared-web

- **Purpose:** Shared components/types/utils and design tokens consumers.
- **Key files:** `src/index.ts` (exports), `utils/`, `types/`.
- **Exposes:** npm package `@vpn-suite/shared` (`workspace:*`).
- **Depends on:** React peer; optional Faro/Posthog deps in package.

### apps/telegram-bot

- **Purpose:** Telegram Stars payments relay, `/start`, miniapp deep links, health/metrics.
- **Key files:** `main.py`, `config.py`, `handlers/*.py`, `api_client.py`.
- **Exposes:** Bot updates; aiohttp `PORT` (e.g. 8090) `/healthz`, metrics.
- **Depends on:** Admin API (`PANEL_URL`), Redis optional, Telegram API.

### apps/node-agent

- **Purpose:** Per-host reconciliation of WireGuard peers vs control-plane desired state.
- **Key files:** `agent.py` (main), `log_utils.py`.
- **Exposes:** HTTP `/metrics`, `/healthz`; outbound mTLS to `CONTROL_PLANE_URL`.
- **Depends on:** Docker socket, local AWG containers, shared `AGENT_SHARED_TOKEN`.

### infra

- **Purpose:** Compose stacks, Caddyfile, Prometheus/Grafana/Loki configs, runtime scripts.
- **Key files:** `compose/docker-compose.yml`, `proxy/caddy/`, `monitoring/config/`.
- **Exposes:** Published ports 80/443/8443, localhost metrics ports.
- **Depends on:** Host Docker, `.env` from repo root.

### mcp-servers

- **Purpose:** Cursor MCP servers (vault tasks, read project files).
- **Key files:** `package.json`, `obsidian-mcp/`, `filesystem-mcp/`.
- **Exposes:** stdio MCP tools (`vault_*`, `fs_*`).
- **Depends on:** Node ≥18, `@modelcontextprotocol/sdk`.

### docs

- **Purpose:** Human documentation; `docs/codebase-map.md` overlaps this note.
- **Depends on:** None (reference only).

## Environment variables

(Sampled from `.env.example`, `mcp-servers/.env.example`, `apps/node-agent/.env.example`. Keys only.)

| Variable | Service / area | Notes |
|----------|----------------|-------|
| `PUBLIC_DOMAIN` | Core / Caddy | Public hostname. |
| `POSTGRES_*`, `DATABASE_URL` | admin-api, worker | DB connection. |
| `REDIS_URL`, `REDIS_PASSWORD` | admin-api, bot | Cache, rate limits, bot FSM. |
| `SECRET_KEY` | admin-api | JWT signing. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | admin-api | Bootstrap admin. |
| `*_CONFIRM_TOKEN` | admin-api | Destructive action confirmations. |
| `CORS_ALLOW_ORIGINS`, `VPN_DEFAULT_HOST` | API / VPN issuance | CORS and endpoint host hints. |
| `NODE_MODE`, `NODE_DISCOVERY` | Control plane | `mock`/`real`/`agent`, `docker`/`agent`. |
| `AGENT_SHARED_TOKEN`, `AGENT_*`, `CONTROL_PLANE_URL`, `REQUIRE_MTLS`, `TLS_INSECURE_SKIP_VERIFY` | node-agent, API | Agent auth and TLS. |
| `DOCKER_GID` | Compose | Socket access for API/worker/agent. |
| `GRAFANA_*`, `PROMETHEUS_HOST_PORT`, image pins | Monitoring stack | |
| `DOCKER_TELEMETRY_*`, `TELEMETRY_*`, `OTEL_TRACES_ENDPOINT` | Telemetry / OTEL | |
| `BOT_TOKEN`, `TELEGRAM_BOT_TOKEN`, `BOT_API_KEY`, `BOT_USERNAME`, `VITE_TELEGRAM_*` | Bot, frontends | |
| `PANEL_URL`, `MINIAPP_URL`, `PORT`, `SUPPORT_*` | Bot | |
| `TELEGRAM_STARS_WEBHOOK_SECRET` | Bot / payments | |
| `VITE_*` | admin-web, miniapp | Build-time (see commented block in `.env.example`). |
| `VAULT_PATH`, `PROJECT_PATH` | mcp-servers | Cursor MCP paths. |
| `SERVER_ID`, `MTLS_*`, `CONTAINER_FILTER`, `INTERFACE_NAME` | node-agent `.env` | Host-specific agent. |

## External dependencies

| Package | Version (declared) | Used in |
|---------|-------------------|---------|
| `fastapi` | 0.114.2 | admin-api |
| `uvicorn[standard]` | 0.31.1 | admin-api |
| `sqlalchemy[asyncio]` | 2.0.46 | admin-api |
| `alembic` | 1.18.4 | admin-api |
| `asyncpg` | 0.29.0 | admin-api |
| `redis` | 5.3.1 | admin-api |
| `pydantic` / `pydantic-settings` | 2.12.x / 2.13.0 | admin-api |
| `httpx` | 0.27.2 | admin-api |
| `docker` | 7.1.0 | admin-api |
| `opentelemetry-*` | 1.39.x | admin-api |
| `aiogram` | 3.25.0 | telegram-bot |
| `aiohttp` | 3.13.3 | telegram-bot |
| `redis` | 7.2.0 | telegram-bot |
| `httpx` | 0.28.1 | telegram-bot |
| `requests` | 2.32.3 | node-agent |
| `docker` | 7.1.0 | node-agent |
| `prometheus-client` | 0.21.0 | node-agent |
| `react` / `react-dom` | ^18.3.1 | admin-web, miniapp, shared peers |
| `@tanstack/react-query` | ^5.62.x | admin-web, miniapp |
| `vite` | ^6.0.1 | admin-web, miniapp |
| `@modelcontextprotocol/sdk` | ^1.29.0 | mcp-servers |
| Root `devDependencies` | eslint, typescript ~5.9.3, storybook ^10.x | pnpm root | |

## Open questions

- [ ] Exact live route table vs OpenAPI (`openapi/openapi.yaml`) not diffed in this pass.
- [ ] Full `fs_list` recursive JSON from MCP **truncated** at ~50MB; file counts use `find` excluding `node_modules`/`.venv` instead.
- [ ] Whether every AGENTS.md / README cluster endpoint claim matches current `app/api/v1/cluster.py` behavior was not verified runtime.

