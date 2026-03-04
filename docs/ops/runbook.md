# Runbook — Ops, Troubleshooting, Backups

**Production:** Must use `NODE_DISCOVERY=agent` and `NODE_MODE=agent`. Only node-agent may mutate WireGuard/AmneziaWG peers. Control-plane with `NODE_DISCOVERY=docker` will refuse to start when `ENVIRONMENT=production`.

## Env & secrets

- **Config:** repo-root `.env` (chmod 600). mTLS: `secrets/agent_ca.pem`, `secrets/pki/agent_ca.key`. Node: `amnezia-awg2/secrets/node.env` (0600).
- **Bootstrap:** `cd /opt/vpn-suite && ./ops/bootstrap-prod.sh` (creates agent CA, prod .env, node client cert)

## Start/stop

```bash
cd /opt/vpn-suite && ./manage.sh up-core
./manage.sh down-core
```

Node (per server): `cd /opt/amnezia/amnezia-awg2 && ./manage.sh up|down`

## Agent (mTLS + allowlist)

- Agent API: `https://$PUBLIC_DOMAIN:8443/api/v1/agent/*`. Caddy enforces mTLS. Set `AGENT_ALLOW_CIDRS` in `.env` if needed.
- **Rotate agent token:** `./ops/rotate-agent-token.sh` then `./manage.sh up-core` and restart node-agent.

## Backups

- **Postgres:** `./manage.sh backup-db` → `backups/postgres/pgdump_*.dump`. Restore: `./manage.sh restore-db --force backups/postgres/pgdump_<ts>.dump` (run on staging first).
- **Safeguards:** See [postgres-safeguards.md](postgres-safeguards.md) — never run `docker compose down -v`; `rebuild-restart` and `down-core` auto-backup unless `BACKUP_SKIP=1`.
- **Redis:** `docker compose exec redis redis-cli BGSAVE`; copy volume or `dump.rdb`. Restore: stop admin-api/redis, replace data, start.
- **Schedule:** use `ops/systemd/vpn-suite-backup-db.timer`.

## Troubleshooting

**Request ID:** UI error shows Request ID → search admin-api logs for `request_id=...`; logs have method, path, status, duration_ms; 5xx include stack trace.

**502:** Caddy can’t reach admin-api → check `docker compose ps`, `docker compose logs admin-api`, Postgres/Redis. Caddyfile uses `health_uri /health`, `health_interval 10s`, and `lb_try_duration 5s` on admin-api upstreams so brief backend restarts may succeed on retry. For full stack start use `docker compose up -d --wait` so the CLI waits for healthy before returning.

**500:** Use request ID in logs for stack trace. Typical: DB/Redis, missing config, route error.

**Control-plane 503:** `GET /api/v1/control-plane/automation/status` and events need migrations (control_plane_events), admin with `cluster:read`. If 500 → check logs for migration/RBAC.

**Postgres PANIC / "No space left on device":** Host disk full. Immediate: `df -h`; free space (`docker system prune`, remove old backups). Long-term: add `node_filesystem_avail_bytes` / `node_filesystem_size_bytes` alert (e.g. <15% free); rotate logs; monitor Docker volumes.

**ServersAPIHigh5xxRate:** Check logs for 5xx on `/api/v1/servers*`; verify Postgres/Redis.

**OverviewOperatorHigh5xxRate:** Check logs for `/api/v1/overview/operator`; use request_id from UI banner; validate Prometheus availability and degraded payload (`data_status`).

**Dashboard not loading when on VPN:** By design the dashboard is reachable from VPN clients; see [dashboard-access-when-on-vpn.md](dashboard-access-when-on-vpn.md) for flow and verification. If it fails only when connected, check host firewall and tunnel-subnet rules.

**One network / client cannot reach dashboard (others can):** Server-side: `sudo ufw status` (80/443 allow Anywhere); `docker compose exec redis redis-cli KEYS "ratelimit:*"` (if client IP appears and is high, rate limit may be hitting — keys expire in 60s window); `docker compose logs reverse-proxy --since 30m` and `docker compose logs admin-api --since 30m` for 502/403/429 from that IP. No IP blocklist in Caddy or app. Client-side: from a device on that network run `curl -v https://vpn.vega.llc/admin` and `nslookup vpn.vega.llc` (or `dig vpn.vega.llc`); try mobile data vs Wi‑Fi to isolate ISP/router; check router firewall or parental controls.

**VPN no traffic (handshake OK):** [no-traffic-troubleshooting.md](no-traffic-troubleshooting.md) § Deep debug (AmneziaWG in Docker) — classification, diagnostics (wg show, NAT, Docker network mode, MTU), request-3-things for remote support, minimal fix plan. **NAT:** Run `sudo ./ops/amnezia-nat-setup.sh` on the VPN host to add MASQUERADE for tunnel subnets.

**DNS / ERR_NAME_NOT_RESOLVED triage (P0):**
- Run `./ops/dns_synthetic_check.sh vpn.vega.llc 185.139.228.171`.
- Verify resolver answers manually:
  - `dig @1.1.1.1 vpn.vega.llc A`
  - `dig @8.8.8.8 vpn.vega.llc A`
  - `dig @9.9.9.9 vpn.vega.llc A`
- Verify HTTPS path:
  - `curl -v https://vpn.vega.llc/health`
  - `curl -v https://vpn.vega.llc/api/v1/servers?limit=1&offset=0`
- During stabilization use A-only record and TTL=300 (if IPv6 is not fully validated).

**DNS rollback plan:**
- After 24h stable synthetic checks, restore previous TTL.
- If a DNS record change caused regression, restore provider export/snapshot immediately.

## Debug broken node metrics

Use this flow when `/admin/telemetry` or `/admin/servers` shows missing/stale metrics.

1. Validate API and scrape health:
   - `curl -sS http://127.0.0.1:8000/health`
   - `curl -sS http://127.0.0.1:8000/api/v1/servers/telemetry/summary -H "Authorization: Bearer <ADMIN_JWT>"`
   - `curl -sS http://127.0.0.1:8000/api/v1/telemetry/docker/hosts -H "Authorization: Bearer <ADMIN_JWT>"`
2. Check Prometheus and recent scrape state:
   - `curl -sS http://127.0.0.1:${PROMETHEUS_HOST_PORT:-19090}/-/ready`
   - `curl -sS 'http://127.0.0.1:${PROMETHEUS_HOST_PORT:-19090}/api/v1/query?query=up'`
3. Check telemetry ingest and cache freshness metrics:
   - `curl -sS http://127.0.0.1:8000/metrics | rg 'frontend_telemetry_(events|batches)_total|vpn_server_snapshot_staleness_seconds'`
4. Check API and worker logs with request/correlation IDs:
   - `docker compose logs admin-api --since 30m | rg 'frontend\\.event|api.request.end|request_id|correlation_id'`
   - `docker compose logs admin-worker --since 30m | rg 'telemetry|snapshot|error'`
5. If dashboard is stale but API routes are healthy, force refresh paths:
   - `./manage.sh server:sync <server_id>`
   - `curl -sS http://127.0.0.1:8000/api/v1/servers/snapshots/summary -H "Authorization: Bearer <ADMIN_JWT>"`

Expected:
- `/servers/telemetry/summary` returns `200`.
- `frontend_telemetry_events_total` and `frontend_telemetry_batches_total` increase after UI activity.
- API logs contain matching `request_id` and `correlation_id`.

## Trace a user action end-to-end

Use this for incident triage from UI action to backend logs/metrics/audit.

1. Trigger the action in Admin UI and capture the debug packet from the error/success surface.
   - Packet must include endpoint, status, `request_id`, and `correlation_id`.
2. Search API logs by `request_id` first:
   - `docker compose logs admin-api --since 30m | rg '<request_id>'`
3. Correlate cross-request/tab behavior by `correlation_id`:
   - `docker compose logs admin-api --since 30m | rg '<correlation_id>'`
4. Check audit events for privileged mutations:
   - `curl -sS 'http://127.0.0.1:8000/api/v1/audit?limit=50&offset=0' -H "Authorization: Bearer <ADMIN_JWT>"`
   - Filter by `request_id`.
5. Validate metrics for action impact:
   - `curl -sS http://127.0.0.1:8000/metrics | rg 'frontend_telemetry_events_total|vpn_server_sync_total|vpn_admin_rotate_total'`

Expected:
- Response headers echo `X-Request-ID` and `X-Correlation-ID`.
- Error envelope `meta` includes `request_id` and `correlation_id`.
- Audit and metrics can be matched to the same action window.

## Restart / rotate keys / profile

- **Restart AmneziaWG:** Disconnects peers briefly; clients usually reconnect. Needs confirm token. No rollback except fix container if it doesn’t start.
- **Rotate server keys:** All existing configs stop working until users get new configs. Plan rollout; communicate “re-download config”.
- **Apply server profile:** Can change listen port/params; clients may need new config. Validate profile; keep previous snapshot for rollback.

## Control-plane checklist (zero downtime)

1. Discover node: `NODE_MODE=real`, `NODE_DISCOVERY=docker`; `POST /api/v1/cluster/scan` (Bearer). In this mode **node-agent MUST be off**; peers are managed only by docker runtime reconcile.
2. Agent mode (production): `NODE_MODE=agent`, `NODE_DISCOVERY=agent`; bring up node-agent via `./manage.sh up-agent` (profile `agent`) on the node — **do not mount Docker socket into admin-api**.
3. Run `./manage.sh sanity-check` after changing env to verify there is no mixed control-plane (e.g. node-agent running while `NODE_DISCOVERY=docker`).
4. Set server `public_key` and `vpn_endpoint` (Admin or API).
5. Issue config from bot or admin; add_peer does not drop existing peers.

## Drift, key sync, reissue, support-bundle

- **Drift:** In agent mode, node-agent reconciles desired state from the API; use agent logs and `agent_peers_desired` / `agent_peers_runtime` metrics. In docker mode, control-plane runs reconcile loop; trigger once with `./manage.sh node-resync` or `./manage.sh server:reconcile <server_id>` (single node).
- **Key sync:** If server key in DB is stale or issuance returns `SERVER_NOT_SYNCED`, run `./manage.sh server:sync <server_id>` (runs `fix_server_public_key.py`) so DB gets the live key from node/heartbeat.
- **Reissue device:** Use API `POST /api/v1/devices/{device_id}/reissue` with admin auth. Blocks with 409 if server key not verified; run server:sync first if needed.
- **Support bundle:** `./manage.sh support-bundle [--output DIR]` collects bounded service logs (admin-api, admin-worker), Redis agent heartbeat keys list, and manifest. For last N audit events use `GET /api/v1/audit?limit=N` with admin auth.

## Day-2 incidents (common patterns)

- **Telemetry pipeline stalled**
  - Symptom: dashboards show stale data; alerts `TelemetryPipelineStalled` fire; `vpn_server_snapshot_staleness_seconds` keeps growing.
  - Checks:
    - `./manage.sh up-monitoring` and `curl -sS http://127.0.0.1:${PROMETHEUS_HOST_PORT:-19090}/-/ready`
    - `curl -sS http://127.0.0.1:8000/metrics | rg 'telemetry_poll_runs_total|vpn_server_snapshot_staleness_seconds'`
    - `docker compose logs admin-worker --since 15m | rg 'telemetry|snapshot|error'`
  - Fix:
    - Restart telemetry worker container; verify `telemetry_poll_runs_total` increases and staleness drops.
    - For a single server: `./manage.sh server:sync <server_id>` and refresh `/admin/servers` + Grafana node health dashboards.

- **Node drift / peers mismatch**
  - Symptom: devices appear active in Admin but no traffic; alerts `VpnPeersDrift` / `VpnPeersAllMissing` or `VpnDevicesNoHandshake` fire.
  - Checks:
    - Admin: open server detail and compare desired vs runtime peers.
    - Prometheus: `vpn_peers_expected`, `vpn_peers_present`, `vpn_devices_no_handshake`.
    - Node: `wg show` or AmneziaWG UI for actual peers.
  - Fix:
    - Run `./manage.sh server:reconcile <server_id>` (agent mode preferred) and monitor drift metrics.
    - If keys are out of sync, run `./manage.sh server:sync <server_id>` then reissue affected devices.

- **Payments failing**
  - Symptom: alerts `PaymentWebhookFailureRate` / `PaymentsErrorBudgetBurn*` fire; operators report missing activations.
  - Checks:
    - Grafana payment health dashboard (webhook rate by status).
    - Prometheus: `payment_webhook_total` and `vpn_revenue_payment_total`.
    - Admin logs: `docker compose logs admin-api --since 30m | rg 'payment|telegram_stars|webhook'`.
  - Fix:
    - Confirm `TELEGRAM_STARS_WEBHOOK_SECRET` and bot token in `.env`.
    - Replay a single webhook from provider if supported; monitor that `payment_webhook_total{status="processed"}` increases and alerts clear.

## Rollback and feature-flag mitigations

- **Disable env editor:** `APP_ENV_EDITOR_ENABLED=0`
- **Disable or throttle frontend telemetry:** `ADMIN_TELEMETRY_EVENTS_ENABLED=0` or `ADMIN_TELEMETRY_SAMPLE_RATE=<0..1>`
- **Telemetry ingestion issues:** Set `ADMIN_TELEMETRY_EVENTS_ENABLED=0`; validate with `curl -sS http://127.0.0.1:8000/metrics | rg 'frontend_telemetry_(events|batches)_total'`
- **Idempotency issues:** Temporarily stop sending `Idempotency-Key` from frontend mutating actions; validate replay behavior before re-enabling
- **Settings endpoint lock:** Ensure `APP_ENV_EDITOR_ENABLED=0`; keep `settings:dangerous` limited to trusted roles
- **Verification after rollback:** `BASE_URL=http://127.0.0.1:8000 bash scripts/release_api_happy_path.sh`; confirm `/api/v1/servers/device-counts` 200, `/health` and `/metrics` healthy; check logs for errors

## Host isolation (production)

- Control-plane host: only vpn-suite-* containers. Nodes: amnezia-awg* + node-agent.
- Postgres/Redis not on host ports. Bot 8090 firewalled or localhost if needed.
