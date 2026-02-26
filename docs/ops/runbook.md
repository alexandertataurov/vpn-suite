# Runbook — Ops, Troubleshooting, Backups

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
- **Redis:** `docker compose exec redis redis-cli BGSAVE`; copy volume or `dump.rdb`. Restore: stop admin-api/redis, replace data, start.
- **Schedule:** use `ops/systemd/vpn-suite-backup-db.timer`.

## Troubleshooting

**Request ID:** UI error shows Request ID → search admin-api logs for `request_id=...`; logs have method, path, status, duration_ms; 5xx include stack trace.

**502:** Caddy can’t reach admin-api → check `docker compose ps`, `docker compose logs admin-api`, Postgres/Redis.

**500:** Use request ID in logs for stack trace. Typical: DB/Redis, missing config, route error.

**Control-plane 503:** `GET /api/v1/control-plane/automation/status` and events need migrations (control_plane_events), admin with `cluster:read`. If 500 → check logs for migration/RBAC.

**ServersAPIHigh5xxRate:** Check logs for 5xx on `/api/v1/servers*`; verify Postgres/Redis.

**OverviewOperatorHigh5xxRate:** Check logs for `/api/v1/overview/operator`; use request_id from UI banner; validate Prometheus availability and degraded payload (`data_status`).

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

## Restart / rotate keys / profile

- **Restart AmneziaWG:** Disconnects peers briefly; clients usually reconnect. Needs confirm token. No rollback except fix container if it doesn’t start.
- **Rotate server keys:** All existing configs stop working until users get new configs. Plan rollout; communicate “re-download config”.
- **Apply server profile:** Can change listen port/params; clients may need new config. Validate profile; keep previous snapshot for rollback.

## Control-plane checklist (zero downtime)

1. Discover node: `NODE_MODE=real`, `NODE_DISCOVERY=docker`; `POST /api/v1/cluster/scan` (Bearer). Agent mode: heartbeat only.
2. Set server `public_key` and `vpn_endpoint` (Admin or API).
3. Issue config from bot or admin; add_peer does not drop existing peers.

## Host isolation (production)

- Control-plane host: only vpn-suite-* containers. Nodes: amnezia-awg* + node-agent.
- Postgres/Redis not on host ports. Bot 8090 firewalled or localhost if needed.
