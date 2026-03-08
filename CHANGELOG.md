# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Added

- Admin Servers operator console (snapshot sync): server state from AmneziaWG nodes as source of truth; manual `POST /servers/:id/sync`, auto-sync loop, snapshot (CPU/RAM, peers, IP pool); telemetry columns and Sync button; Prometheus metrics and config (SERVER_SYNC_*).
- Admin Servers Operator Console: issue config from chosen server, one-time download/QR by token; rotate and revoke peers; audit with request_id; idempotency and rate limiting; Prometheus metrics and alert rules.

### Changed

- (None)

### Deprecated

- (None)

### Removed

- **Breaking:** `Server.integration_type` (migration 036) and `Device.outline_key_id` (migration 035). Outline integration removed; use AmneziaWG + node-agent only.

### Fixed

- (None)

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
