# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI control plane, Alembic migrations, and Python tests in `backend/tests/`.
- `frontend/`: pnpm workspace with `admin/`, `miniapp/`, and shared UI/code in `shared/`.
- `bot/`: Telegram bot service with its own `tests/` and dependency set.
- `node-agent/`: host-side agent for node/runtime integration.
- `config/`, `docker/`, and `docker-compose*.yml`: deployment, proxy, Redis, and observability config.
- `docs/` stores design, API, ops, and release notes; update docs when behavior or workflows change.

## Build, Test, and Development Commands
- `./manage.sh up-core`: start Postgres, Redis, admin API, worker, reverse proxy, and bot.
- `./manage.sh up-monitoring`: bring up Prometheus, Grafana, Loki, and related monitoring services.
- `./manage.sh build` or `./manage.sh build-all`: build the main API image or all service images.
- `cd backend && pytest`: run backend tests.
- `cd bot && pytest`: run bot tests.
- `cd frontend && pnpm run lint && pnpm run typecheck && pnpm run test`: validate both frontend apps.

## Coding Style & Naming Conventions
- Python targets 3.12 with Ruff and MyPy configured in `backend/pyproject.toml`; keep line length to `100`.
- Use `snake_case` for Python modules/functions, `PascalCase` for React components, and `test_*.py` for pytest files.
- Follow existing frontend workspace patterns: shared logic in `frontend/shared`, app-specific UI in each app.
- For Mini App UI, avoid inline styles and hardcoded colors; use tokenized design-system layers described in `CONTRIBUTING.md`.

## Testing Guidelines
- Backend and bot use `pytest`; prefer targeted runs such as `pytest backend/tests/test_control_plane_api.py` before broader suites.
- Frontend checks include lint, typecheck, unit tests, coverage (`pnpm run test:coverage`), and e2e/Storybook flows when UI changes.
- Add or update tests with every behavior change, especially around control-plane logic, device issuance, and design-system components.

## Commit & Pull Request Guidelines
- Follow the repository’s Conventional Commit style, e.g. `chore(miniapp): consolidate design system` or `fix(api): handle peer drift`.
- Keep commits focused and descriptive; scope by subsystem when possible (`backend`, `miniapp`, `bot`, `ops`).
- PRs should include a short summary, reason for change, validation steps, and linked issues.
- If frontend code changes, complete the checklist in `.github/pull_request_template.md`, including accessibility, Storybook, and mobile review items.

## Security & Configuration Tips
- Copy from `.env.example`; never commit real secrets from `.env` or `secrets/`.
- Use `manage.sh` for operational tasks and do not remove persistent Docker volumes for Postgres or Redis.

---

# VPN Suite — AmneziaWG Cluster Control Plane + Telegram Sales Gateway
# AGENTS.md — Codex Project Instructions (ULTRA SPEC V3)

## MCP TOOLS
Always use: **filesystem**, **memory**, **sequential-thinking**, **context7**. Prefer these over shell for file ops, reasoning, and up-to-date library docs. Use context7 for API/docs lookups.

## ROLE
You are a Senior Distributed Systems Engineer AI.
Build and upgrade a production-grade commercial VPN platform based on AmneziaWG (WireGuard-compatible) nodes.
Think like a control-plane architect: discovery, topology, reconciliation, scheduling, HA.

## MANDATORY REFERENCES (READ FIRST)
### AmneziaWG
- https://docs.amnezia.org/documentation/amnezia-wg/
- https://docs.amnezia.org/ru/documentation/amnezia-wg/

### WireGuard
- https://www.wireguard.com/
- https://man7.org/linux/man-pages/man8/wg.8.html
- https://man7.org/linux/man-pages/man8/wg-quick.8.html

### Docker
- https://docs.docker.com/engine/reference/commandline/exec/

### FastAPI
- https://fastapi.tiangolo.com/

### Telegram
- https://core.telegram.org/bots/api
- https://docs.aiogram.dev/
- https://aiogram.dev/

### Prometheus / Observability
- https://prometheus.io/docs/introduction/overview/

### Security Baseline
- https://cheatsheetseries.owasp.org/

## SYSTEM MODEL
- Telegram Bot = Sales Gateway (client, UX, payments, promo/referrals, analytics events)
- Admin API (FastAPI) = Control Plane (orchestration brain)
- AmneziaWG containers = Execution Nodes (no REST API)
- Docker = runtime control channel
- Postgres = source of truth
- Redis = FSM + rate limit + queues + ephemeral state
- Prometheus = metrics

## HARD CONSTRAINTS
1) AmneziaWG nodes DO NOT expose a public HTTP management API.
   Control via WireGuard runtime commands only:
   - `wg show`, `wg set`, `wg syncconf` (inside container)
2) Control channel is ONLY:
   - `docker exec <container> wg ...`
3) NEVER hardcode interface name `wg0`. Detect dynamically via `wg show`/`ip a`.
4) NEVER expose docker socket externally. Never run unsanitized shell. Never log private keys.

## CLUSTER AUTO-DISCOVERY
- Periodically run:
  - `docker ps --format '{{.Names}}'`
- Filter containers:
  - `amnezia-awg*`
- For each node:
  - `docker exec <node> wg show`
  - `docker exec <node> ip a`
- Build and persist TopologyMap:
  - container_name, iface, listen_port, peer_count, health_score, last_seen

## TOPOLOGY ENGINE (CONTROL LOOP)
Implement Kubernetes-style reconciliation:
discover -> compare -> reconcile -> repair drift

Drift examples:
- peer exists in runtime but not DB
- DB peer missing from runtime
- node restart changes iface/port visibility

Operations must be idempotent.

## LOAD BALANCER / SCHEDULER
When provisioning a new peer, select node using weighted scoring:
- capacity (free slots)
- health score
- latency penalty (optional)
No hardcoded node names. Support N nodes.

## HIGH AVAILABILITY (SOFT HA)
- Detect node failure via `docker exec ... wg show` timeout/error.
- Mark node unhealthy; stop scheduling new peers there.
- Schedule migration:
  - create peer on new node
  - issue new client config
  - deprecate old peer in DB
Goal: minimal downtime, safe retries.

## ADMIN API (FASTAPI) REQUIRED ENDPOINTS
### Cluster
- GET  /cluster/topology
- GET  /cluster/nodes
- GET  /cluster/health
- POST /cluster/resync

### Provisioning
- POST   /wg/peer
- DELETE /wg/peer/{pubkey}
- GET    /wg/peers
- GET    /wg/status

Bot must call ONLY Admin API, never WG directly.

## TELEGRAM BOT (SALES GATEWAY) V2
Bot responsibilities:
- onboarding
- plan selection
- payments orchestration
- promo codes + referrals
- subscription management (renew/upgrade/downgrade)
- config delivery (QR / file / deep link)
- analytics events to admin-api

Bot must be cluster-agnostic: it never chooses node.
It requests provisioning from admin-api and receives config payload.

Redis usage:
- FSM session state
- payment pending state
- rate limit / anti-spam

Events:
- user_started, plan_viewed, payment_started, payment_success, config_issued, subscription_expired

## NODE DISCOVERY BY IP (FALLBACK)
Primary mode should be registry/auto-discovery via Docker.
If IP-based discovery is needed, it MUST be safe:
- protocol: UDP
- limited port allowlist (default WG port 51820 + configured ranges)
- strict timeouts + rate limits + concurrency caps
Do NOT scan TCP 80/443 to “find AmneziaWG”.

## OBSERVABILITY (PROMETHEUS METRICS)
Expose metrics:
- vpn_nodes_total
- vpn_node_health
- vpn_peers_total
- vpn_cluster_load_index
- bot_conversion_rate
- provisioning_failures_total
- docker_exec_latency_ms

## DELIVERABLES
1) Architecture proposal (modules, responsibilities, data model)
2) Implementation in small PR-sized steps
3) Tests / linters
4) Migration plan for prod
5) Documentation updates

## PROHIBITED
- No docker socket exposure.
- No plaintext key material in logs.
- No blocking IO in async handlers.
- No invented APIs inside awg containers.
