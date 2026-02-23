# Changelog

All notable changes to the VPN Suite project are documented here.

## [Unreleased]

### Added

- **Admin Servers operator console (snapshot sync):** Server state from AmneziaWG nodes as source of truth. Manual sync: `POST /servers/:id/sync` with request_id and job status; auto-sync loop (configurable interval, jitter, max concurrency, per-server backoff). Snapshot includes CPU/RAM (docker stats), peers, IP pool (used/total). Telemetry columns on Servers table (CPU, RAM, Peers, IPs) from snapshot when available; "Last sync" and Sync button with request_id in toasts. Prometheus: `vpn_server_sync_total`, `vpn_server_sync_latency_seconds`, `vpn_server_snapshot_staleness_seconds`. Config: `SERVER_SYNC_INTERVAL_SECONDS` (0=disabled), `SERVER_SYNC_MAX_CONCURRENT`, `SERVER_SYNC_BACKOFF_MAX_SECONDS`, `SERVER_SYNC_SKIP_DRAINING`. See `docs/admin-servers-operator-console-design.md` and troubleshooting (Server sync).
- **Admin Servers Operator Console**: Issue config from chosen server (AmneziaWG or WireGuard), one-time download/QR by token; rotate and revoke peers from server detail; audit with `request_id`; idempotency and rate limiting for issue and config download; Prometheus metrics (`vpn_admin_issue_total`, `vpn_admin_rotate_total`, `vpn_admin_revoke_total`, `vpn_config_download_total`) and alert rules (issuance failures, config download spike).

## [0.1.0-rc.1] — 2025-02-12

### Added

- Admin API (FastAPI): auth (JWT), RBAC, audit log, servers/users/subscriptions/plans/devices CRUD.
- Bot-facing API: create-or-get subscription, create-invoice (Telegram Stars), issue device, reset device, referral and promo endpoints.
- Payment webhooks: Telegram Stars; idempotent by `external_id`; subscription extension, referral reward, promo redemption.
- Issue profile (devices): generate keys, save device; **in RC peer is not created on the VPN node** (mock mode). Set `NODE_MODE=real` and implement `NodeGateway.create_peer` for production.
- Servers: metadata CRUD, health-check, restart (two-step), status, limits, block/reset peer via node API.
- Limits: traffic/speed/connections via node API; soft/hard; auto-block when exceeded (background check).
- Observability: structured logs (JSON, request_id), Prometheus `/metrics`, `/health` and `/health/ready`.
- Backup/restore procedure: `docs/RUNBOOK.md`. Analytics queries: `docs/analytics.md`.

### Note

- **Node mode:** In RC, issue profile uses `NODE_MODE=mock` by default: config is returned but no peer is created on the node. For production, implement `create_peer` in NodeGateway and set `NODE_MODE=real`.
