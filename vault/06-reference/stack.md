---
type: stack-reference
updated: 2026-04-11
---

# Stack reference

## Languages & runtimes

- **Python 3.12** — `apps/admin-api`, `apps/telegram-bot`, `apps/node-agent` (per `AGENTS.md` / `pyproject` tool config).
- **TypeScript** — pnpm workspaces (`apps/admin-web`, `apps/miniapp`, `apps/shared-web`, root tooling).
- **Bash** — `manage.sh`, `infra/scripts/`.
- **SQL** — PostgreSQL via SQLAlchemy + Alembic.

## Frameworks

- **Backend:** FastAPI, Starlette, Pydantic Settings, SQLAlchemy 2 async, Alembic, Redis async client, python-jose, OpenTelemetry Python SDK.
- **Frontend:** React 18, React Router 6, TanStack Query 5, Vite 6, Tailwind (admin/miniapp), Storybook 10, Vitest, Playwright.
- **Bot:** aiogram 3, aiohttp server for webhook/metrics.
- **Agent:** stdlib HTTP server + `requests` + Prometheus client; Docker API.

## Infrastructure

- **Containers:** Docker Compose (`infra/compose/docker-compose.yml` + overlays for observability, audit, verification).
- **Proxy/TLS:** Caddy (`infra/proxy/caddy`), mTLS for agent on `:8443`.
- **Data:** PostgreSQL 16 (pinned image digest in compose), Redis.
- **Observability:** Prometheus, Grafana, Loki, Promtail, Alertmanager, cAdvisor, node-exporter, Postgres/Redis exporters, optional VictoriaMetrics/Tempo/OTEL collector (profiles).
- **CI:** GitHub Actions (see `.github/workflows/`).

## Dev tools

- **Python:** Ruff, Mypy (admin-api), pytest, pip-compile (`requirements*.txt`).
- **JS:** ESLint 9, TypeScript ~5.9, pnpm, Vitest, Storybook test runners.
- **Ops:** `./manage.sh` (migrate, seed, check, verify, smoke-staging, backup, openapi export).
- **MCP (local):** `mcp-servers/` — Obsidian + filesystem MCP for agents.

## External services / APIs

- **Telegram** — Bot API, Mini App WebApp, Telegram Stars webhooks.
- **Docker Engine API** — Via mounted socket (admin-api worker, node-agent); not exposed remotely.
- **OTLP** — Optional export to `OTEL_TRACES_ENDPOINT` (e.g. collector sidecar).
- **Third-party analytics (optional)** — PostHog / Grafana Faro / Sentry via `VITE_*` and shared-web deps.

