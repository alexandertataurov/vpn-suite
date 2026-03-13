# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Added

- Admin Servers operator console (snapshot sync): server state from AmneziaWG nodes as source of truth; manual `POST /servers/:id/sync`, auto-sync loop, snapshot (CPU/RAM, peers, IP pool); telemetry columns and Sync button; Prometheus metrics and config (SERVER_SYNC_*).
- Admin Servers Operator Console: issue config from chosen server, one-time download/QR by token; rotate and revoke peers; audit with request_id; idempotency and rate limiting; Prometheus metrics and alert rules.
- Promo/referral services and miniapp promo flows.
- Miniapp design system consolidation: single token source, layouts, patterns, Storybook stories, design-check CI.
- Frontend shared package; CI pnpm10; hook consolidation.
- Miniapp: Plan, Settings, Usage, Support, ServerSelection pages; shared theme.
- Admin: dashboard (peers, typography), abuse, churn, revenue, retention pages; design-system alignment; Devices, ServerDetail, operator dashboard, adaptive UI.
- Bot: churn, trial, menu handlers; consolidated start/commands and i18n; API client, metrics.
- Backend: admin APIs, control center tasks, metrics; devices config health and operator peers; one-time download links and AWG tooling; admin_configs and users API; address_allocator, issue services, node_runtime_docker, reconciliation, server_obfuscation; amnezia config builder; DB metrics middleware, handshake quality gate, NO_HANDSHAKE reconciliation.
- Services and models: abuse, churn, retention, revenue, trial, pricing, promo.
- Docker discovery: filter by container prefix, dedupe VPN servers by container_name.
- Ops: diagnose-no-traffic script, incident report template, amnezia-nat-setup systemd unit; launch KPIs, ops guide, Grafana dashboards.
- Config and monitoring: alert rules, discovery, Grafana, Prometheus, Loki, OpenAPI export.
- CI: frontend-e2e reuses admin dev server for Playwright; hardened workflows; API happy-path contract optional; buildx + GHA cache for admin-api; Dockerfile HEALTHCHECK.
- Docs: observability and miniapp specs, revenue-engine specs, codebase-map, runbook, bot codebase-map; remove Outline from observability config.
- Miniapp Storybook contract governance: reduced executable contract suite, contract inventory check, CI workflow enforcement, non-blocking official runner probe, and repo-level docs/PR guidance.

### Changed

- Design system: single `:root` token source; admin/miniapp parity; design-system checks in CI.
- issue/rotate: persistent_keepalive from request_params; defaults for restrictive networks (MTU 1200, keepalive 15, DNS 8.8.8.8 and 8.8.4.4).
- Repository automation docs: canonicalized `AGENTS.md` filename and merged Codex instructions so case-sensitive environments pick up the correct agent guidance.

### Deprecated

- (None)

### Removed

- **Breaking:** `Server.integration_type` (migration 036) and `Device.outline_key_id` (migration 035). Outline integration removed; use AmneziaWG + node-agent only.
- Deprecated documentation files; obsolete root docs.

### Fixed

- Backend: skip live key fetch in mock mode; finalize one-time downloads and telemetry; ruff cleanups; format public download endpoint.
- CI: ruff/mypy/Storybook/design-system steps, pip-audit/storybook-runner non-blocking, shell strictness, cache-dependency-path for pnpm; install base deps, stabilize backend tests; design-system hardcoded-color check and empty grep; avoid secrets in if/env.
- Frontend: devices table typing; cn helper deps; miniapp unused-vars and typecheck layers.

### Security

- (None)

---

## [0.1.0-rc.1] - 2025-02-12

[Full diff](https://github.com/alexandertataurov/vpn-suite/compare/v0.1.0-rc.1...HEAD) · [Release](https://github.com/alexandertataurov/vpn-suite/releases/tag/v0.1.0-rc.1)

### Added

- Admin API (FastAPI): auth (JWT), RBAC, audit log, servers/users/subscriptions/plans/devices CRUD.
- Bot-facing API: create-or-get subscription, create-invoice (Telegram Stars), issue device, reset device, referral and promo endpoints.
- Payment webhooks: Telegram Stars; idempotent by external_id; subscription extension, referral reward, promo redemption.
- Issue profile (devices): generate keys, save device; in RC peer is not created on the VPN node (mock mode). Set NODE_MODE=real and implement NodeGateway.create_peer for production.
- Servers: metadata CRUD, health-check, restart (two-step), status, limits, block/reset peer via node API.
- Limits: traffic/speed/connections via node API; soft/hard; auto-block when exceeded (background check).
- Observability: structured logs (JSON, request_id), Prometheus /metrics, /health and /health/ready.
- Backup/restore procedure: docs/ops/runbook.md. Analytics: docs/audits/analytics.md.

### Note

- Node mode: In RC, issue profile uses NODE_MODE=mock by default (config returned, no peer on node). For production, implement create_peer and set NODE_MODE=real or NODE_MODE=agent.
