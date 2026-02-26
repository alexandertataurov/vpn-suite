# VPN-Suite System Map

> **Generated**: 2026-02-26 · **Coverage**: 100% of repo folders

---

## 1. Service Inventory

| Service | Path | Language | Purpose |
|---|---|---|---|
| `admin-api` | `backend/` | Python 3.12 / FastAPI | Control-plane REST API, 20+ routers, auth, device issue/revoke, telemetry, payments |
| `admin-frontend` | `frontend/admin/` | TypeScript / React / Vite / Tailwind | Admin SPA — devices, servers, users, telemetry, billing dashboards |
| `miniapp` | `frontend/miniapp/` | TypeScript / React | Telegram Mini App — user-facing VPN subscription & device management |
| `shared-ui` | `frontend/shared/` | TypeScript | Design system, API client types, utility hooks — consumed by admin & miniapp |
| `telegram-vpn-bot` | `bot/` | Python 3.12 / aiogram 3 | Telegram bot — user self-service, webhook handler, references admin-api |
| `node-agent` | `node-agent/` | Python 3.12 | Pull-based WireGuard/AmneziaWG node reconciler; connects to control-plane |
| `reverse-proxy` | `docker/reverse-proxy/` | Caddy | TLS termination, serves static frontends, mTLS for agent endpoints |
| `admin-ip-watcher` | `docker-compose.yml` (service) | Shell | Watches for container IP changes; rewrites `.env` and re-creates Caddy |

### Background Tasks inside `admin-api`

| Task | File | Interval |
|---|---|---|
| Node health checker | `core/health_check_task.py` | 60 s |
| Node telemetry poll | `core/telemetry_polling_task.py` | 30 s |
| Node scan (topology) | `core/node_scan_task.py` | 300 s |
| Reconciliation loop | `services/reconciliation_engine.py` | 60 s |
| Server sync loop | `core/server_sync_loop.py` | 60 s |
| Device expiry task | `core/device_expiry_task.py` | (daily-ish) |
| Limits check | `core/limits_check_task.py` | 300 s |
| Docker alert poll | `core/docker_alert_polling_task.py` | 15 s |
| Handshake quality gate | `core/handshake_quality_gate_task.py` | 5 min |

---

## 2. Data Stores

| Store | Usage | Critical Data |
|---|---|---|
| PostgreSQL | Primary DB; all state | devices, users, subscriptions, servers, payments, audit_log, issued_configs, ip_pool |
| Redis | Session cache, rate limiting, idempotency keys, agent heartbeats, snapshot cache | JWT deny-list, `heartbeat:{server_id}`, telemetry snapshot |

---

## 3. Primary Endpoints / Events

### Public API (`/api/v1/*`)

| Group | Router File | Key Paths |
|---|---|---|
| Auth | `auth.py` | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Users | `users.py` | `GET /users`, `GET /users/{id}`, `POST /users/{id}/ban` |
| Devices | `devices.py` | `GET /devices`, `POST /servers/{id}/peers/issue`, `POST /devices/{id}/revoke` |
| Servers | `servers.py` + `servers_peers.py` | `GET /servers`, `POST /servers/{id}/peers` |
| Telemetry | `telemetry_snapshot.py` | `GET /telemetry/snapshot` |
| Docker Tel. | `telemetry_docker.py` | `GET /telemetry/docker/stats` |
| Payments | `payments.py` + `webhooks.py` | `POST /webhooks/payments/{provider}` |
| Agent | `agent.py` | `POST /agent/heartbeat`, `GET /agent/desired-state` |
| Control Plane | `control_plane.py` | `GET /control-plane/topology`, `GET /control-plane/events` (WebSocket) |
| Dashboard | `dashboard.py` | `GET /dashboard/overview` |
| Overview | `overview.py` | `GET /overview` |

### Agent Pull Loop (node-agent → control-plane)

```
agent (every HEARTBEAT_INTERVAL s, default 10 s):
  1. docker inspect all containers → identify AWG nodes
  2. awg show <iface> dump          → collect peer runtime state
  3. POST /agent/heartbeat           → push state snapshot
  4. GET  /agent/desired-state       → pull desired peers
  5. apply diff (awg set / del)      → reconcile runtime
  6. GET  /agent/v1/actions/poll     → check for pending actions
```

---

## 4. Service Dependency Graph

```
Browser ──────────────────────────────────────────────────▶ reverse-proxy (Caddy 443)
                                                                │       │
                                             ┌──────────────── ◀       ▼
                                             │       admin-api (8000)   static admin/miniapp HTML
Telegram ─────▶ bot (8090) ──────────────────┘              │
                                                          ┌──┤  database: postgres (5432)
                                                          │  │  cache:    redis (6379)
node-agent (mTLS 8443) ─── heartbeat ──────────────────────┘  │
           │                                                    │
           ▼                                                    │
   AmneziaWG container                                          │
   (docker exec awg show / awg set)                             │
                                                                │
prometheus ──── scrape /metrics ───────────────────────────────┘
grafana    ──── query ──────────────────────▶ prometheus / loki
loki       ←── push ──────────── promtail (reads /var/log + docker logs)
```

---

## 5. Infrastructure (Docker Compose)

| Service | Image | Resource Limit |
|---|---|---|
| admin-api | custom (python:3.12-slim) | CPU 0.5, RAM 512 MB |
| reverse-proxy | custom (Caddy) | CPU 0.5, RAM 512 MB |
| admin-ip-watcher | docker:24-cli | CPU 0.2, RAM 128 MB |
| postgres | postgres (pinned SHA) | CPU 1.0, RAM 1 GB |
| redis | redis (pinned SHA) | CPU 0.2, RAM 128 MB |
| telegram-vpn-bot | custom (python:3.12-slim) | CPU 0.2, RAM 128 MB |
| prometheus | prom/prometheus | CPU 1.0, RAM 1 GB (**monitoring profile**) |
| alertmanager | prom/alertmanager | CPU 0.2, RAM 128 MB |
| grafana | grafana/grafana | CPU 0.5, RAM 512 MB |
| loki | grafana/loki | CPU 0.5, RAM 512 MB |
| promtail | grafana/promtail | CPU 0.2, RAM 128 MB |
| cadvisor | gcr.io/cadvisor | CPU 0.2, RAM 128 MB |
| node-exporter | prom/node-exporter | CPU 0.2, RAM 128 MB |
| node-agent | custom (python:3.12-slim) | CPU 0.2, RAM 128 MB (**agent profile**) |

---

## 6. CI/CD Pipeline (`.github/workflows/ci.yml`)

| Job | Steps |
|---|---|
| `lint-test` | ruff check/format → alembic migrate → seed → pytest |
| `build` | docker buildx with GHA layer cache |
| `trivy-scan` | Trivy vuln scan (exit-code: 0 — non-blocking) |
| `frontend-checks` | npm audit → lint → typecheck → vitest → prod build → storybook |
| `secret-scan` | Gitleaks full-history scan |
| `frontend-e2e` | Backend + API up → Playwright E2E |
| `bot-test` | pytest (bot) |

**All jobs run in parallel** — no explicit dependency ordering between lint-test and e2e.

---

## 7. Key External Dependencies

| Dep | Used by | Notes |
|---|---|---|
| AmneziaWG container | node-agent | `docker exec awg show/set` — tight coupling |
| Telegram Bot API | bot | webhook mode, Telegram Stars payment |
| Payment providers | webhooks router | YooKassa, Telegram Stars |
| Docker socket | admin-api, node-agent, admin-ip-watcher | Mounted r/o in admin-api, rw in others |
| Prometheus | admin-api metrics | Push-pull via `/metrics` scrape |
| OTEL Collector | admin-api | Optional traces endpoint |
