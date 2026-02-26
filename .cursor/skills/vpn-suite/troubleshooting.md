# VPN Suite – Troubleshooting

## Bot cannot reach panel

- **Cause**: Wrong URL or not on shared network. Bot must use the internal service name so DNS resolves on the Docker network.
- **Fix**: When bot and panel run in Docker, set `PANEL_URL=http://amnezia-panel-web` (compose overrides bot .env so the bot uses internal URL). Ensure both services use network `vpn-suite`. If you see "Temporary failure in name resolution" or "Cannot connect to host amnezia-panel-web", the bot was likely using a public URL from .env that is unreachable from inside the container—use the compose override above and recreate the bot. Check `./scripts/debug-vpn.sh` section 4b for Bot->Panel connectivity.

## Bot build fails (context / path)

- **Cause**: Bot Dockerfile build context is `/opt`, not `/opt/vpn-suite`. COPY paths in Dockerfile are relative to `/opt`.
- **Fix**: In Dockerfile, reference app as e.g. `COPY telegram-vpn-bot/ ...` (from /opt). Compose uses `context: /opt`, `dockerfile: /opt/vpn-suite/bot/Dockerfile`.

## Healthcheck failing (bot / panel / DB)

- **Bot**: Ensure `/healthz` returns 200 quickly; healthcheck runs inside container (e.g. `curl http://127.0.0.1:8090/healthz`). Increase `start_period` if bot starts slowly.
- **Panel**: Healthcheck is `curl http://localhost/`; ensure web server responds on port 80 inside container.
- **DB**: `mysqladmin ping`; if DB not ready, panel depends on `condition: service_healthy` so it waits.

## Services not resolving each other by name

- **Cause**: Service not on `vpn-suite` network or compose project mismatch.
- **Fix**: All services in `docker-compose.yml` must have `networks: - vpn-suite`. Start with same project: `./manage.sh up-all` (or both profiles). Check `docker network inspect vpn-suite`.

## Panel DB connection refused / migration errors

- **Cause**: DB not healthy yet, wrong host/port, or migration order.
- **Fix**: Panel uses `DB_HOST=amnezia-panel-db`, `DB_PORT=3306` (internal). Migrations run from `services/amneziavpnphp/migrations/` on init. Ensure volume and env match; check `amnezia-panel-db` logs and health.

## Prometheus / Grafana not scraping or no data

- **Cause**: Scrape targets use service names; monitoring stack must be on `vpn-suite` and targets must be up.
- **Fix**: Confirm `monitoring/prometheus.yml` uses correct job names and service hostnames. Run with `--profile monitoring`; check Prometheus targets UI and Grafana datasource.

## Cutover / rollback confusion

- **Cutover**: Backup first (bot data, panel DB, Grafana/Prometheus). Run `./manage.sh cutover-stop-legacy`, then start vpn-suite (`systemctl start vpn-suite` or `./manage.sh up-all`). Verify all healthchecks and critical paths.
- **Rollback**: Stop vpn-suite, then `./manage.sh rollback-start-legacy`. Legacy folders are left in place; no automatic backup restore—restore from backups if needed.

## Volume or permission errors (panel / bot)

- **Panel**: Expects bot data and bot `.env` mounted (`telegram-vpn-bot/data`, `telegram-vpn-bot/.env` under suite). Ensure paths exist and permissions allow container user.
- **Bot**: Data at `telegram-vpn-bot/data` and logs at `telegram-vpn-bot/logs` under the suite; same permission check.

## amnezia-awg not starting or no VPN handshake

- **Cause**: AmneziaWG (metaligh/amneziawg) needs NET_ADMIN, `/dev/net/tun`, and correct UDP port (47604). Volume at `/etc/amnezia/amneziawg` must be initialized (see docs/AMNEZIAWG_DPI.md).
- **Fix**: Verify `cap_add: NET_ADMIN`, `devices: /dev/net/tun`, port `47604:51820/udp`, and volume `amnezia_awg_data:/etc/amnezia/amneziawg`. Check `docker logs amnezia-awg`; init config with `awguser`/`awgstart` inside the container.

## amnezia-awg: "Unknown device type" / "Missing WireGuard (Amnezia VPN) kernel module"

- **Cause**: The container kernel has no `amneziawg` module; `ip link add awg0 type amneziawg` fails. The entrypoint falls back to the userspace implementation (amneziawg-go), then brings the interface up with `awg setconf`; the interface can still work (log may say "interface up (kernel mode)").
- **Fix (optional, for better performance)**: Install the AmneziaWG kernel module on the **host** (if the container shares the host kernel) or use an image that includes it. Build/install from: https://github.com/amnezia-vpn/amneziawg-linux-kernel-module . If you keep the userspace fallback, no action required—VPN can work.

## Sync peers (AmneziaWG)

- **Note**: The AmneziaWG container does not support `wg set`/sync. Add users inside the container with `awguser` and `awgstart`. Panel “Sync peers to VPN” will return a message that sync is not applicable.

## Sync peers: "docker.sock not available"

- **Cause**: Panel runs PHP as `www-data`; the host’s `/var/run/docker.sock` is usually `root:docker` (mode 660), so the container’s `www-data` cannot read it unless it is in the same group.
- **Fix**: Set `DOCKER_GID` to your host’s docker group GID so the panel entrypoint can add `www-data` to that group. On the host run: `getent group docker | cut -d: -f3`, then set in `/opt/vpn-suite/.env`: `DOCKER_GID=<that number>`. Recreate the panel: `docker compose --profile core up -d amnezia-panel-web --force-recreate`.

## VPN: No traffic (DPI blocking)

- **Cause**: In some regions (e.g. Russia), DPI blocks un-obfuscated VPN traffic; you see “connected” but no traffic.
- **Fix**: The stack uses AmneziaWG (metaligh/amneziawg) only. Choose **AmneziaWG** or **AmneziaVPN** in the app. See **docs/AMNEZIAWG_DPI.md**.

## VPN: AmneziaWG configs

- **Cause**: The panel and bot issue full AmneziaWG client configs (real WG keypairs + obfuscation Jc, Jmin, Jmax, S1, S2, H1–H4 from server profile or defaults). The stack runs **metaligh/amneziawg** only.
- **Fix**: In Admin **VPN servers** set **public_key** (from container after `awguser`/`awgstart`) and **vpn_endpoint** (e.g. `vpn.example.com:47604`). Or set `VPN_DEFAULT_HOST=vpn.example.com` in `.env` so Issue Config auto-derives endpoint from the live node's listen_port. Optionally set a server profile with `request_params` (amnezia_jc, amnezia_jmin, amnezia_jmax, amnezia_s1, amnezia_s2, amnezia_h1–h4, client_endpoint, dns). Users choose **AmneziaWG** or **AmneziaVPN** in the app.

## VPN: users cannot connect (VPN server)

- **Cause**: Panel must use the same server public key as the AmneziaWG container, and peers must exist in the container.
- **Fix**: (1) Get server public key from the container (after `awguser`/`awgstart`) and set it in panel **VPN servers** (Load from container is not supported for AmneziaWG; set manually). (2) Set **Endpoint** to your server hostname or IP and port (e.g. `vpn.example.com:47604`). (3) Ensure UDP 47604 is open on the host/firewall. (4) Add users in the container via `awguser`/`awgstart`; Sync peers to VPN is not supported for AmneziaWG.

## VPN: connected but no internet / no traffic

- **Full checklist**: See [docs/ops/no-traffic-troubleshooting.md](../../docs/ops/no-traffic-troubleshooting.md) — server peer AllowedIPs must be client tunnel address (/32), not 0.0.0.0/0.
- **Deep debug (handshake OK, no traffic)**: Same doc, section **Deep debug (AmneziaWG in Docker)** — problem classification, mandatory diagnostics (wg show, ip_forward, NAT, Docker network mode, MTU, tcpdump), "request 3 things" for remote support, and minimal fix plan.
- **Peers not on server**: With AmneziaWG, peers are added in the container via `awguser`/`awgstart`; panel Sync and `./scripts/sync-vpn-peers.sh` do not apply. If devices were synced from bot with `public_key='synced'`, get a new config from the bot (Install VPN / Get config) so the panel has a real key; then add that peer in the container. For add-vpn-peer.sh: it detects AmneziaWG and prints that peers must be added via the container.
- **Firewall**: Host must allow **UDP 47604** for VPN. Run: `ufw allow 47604/udp` then `ufw status`.
- **NAT/forward in container**: The AmneziaWG container (metaligh/amneziawg) handles forwarding; ensure `ip_forward=1` and NAT inside the container per image docs.
- **Check**: Run `./scripts/debug-vpn.sh`; for AmneziaWG, section 5b shows a note that wg CLI is not available and to use awguser/awgstart.

## Admin: issue config / rotate / revoke (operator console)

- **Issue fails (502 / server unreachable)**: Admin API uses Docker runtime to add peer on the node. Ensure `NODE_MODE=real`, Docker socket available to admin-api, and the server (AmneziaWG container) is running. Check `vpn_admin_issue_total{status="failure"}` and logs; use `request_id` from the response to correlate with audit.
- **Config download 404/410**: One-time token may be expired, already consumed, or invalid. Issue a new config from Servers → Issue config (or rotate peer for a new token).
- **Audit**: Filter by `request_id` or `resource_id` (server_id) on the Audit page. `request_id` is set on all issue/rotate/revoke responses.

## Admin peer: cannot connect (server-side)

When one admin peer fails to connect (client may show ErrorCode 1200 / crash during connect→disconnect), verify server-side:

1. **Peer on node**: Admin's public key must exist in the AmneziaWG container. If `add_peer` failed at issue time, the peer was never added. Check: `docker exec <amnezia-awg-container> wg show awg0` and confirm the admin's public key is listed.
2. **NODE_MODE=agent**: With agent mode, control-plane does not add peers; node-agent manages them. Ensure the admin device was pushed to the node (check node-agent logs / desired-state).
3. **Endpoint/port**: Server `vpn_endpoint` must match the actual exposed port (e.g. `vpn.example.com:45790`). Your amnezia-awg2 uses `AWG_PUBLIC_UDP_PORT=45790`; ensure firewall allows UDP 45790.
4. **Obfuscation match**: AmneziaWG requires matching Jc/Jmin/Jmax/S1/S2/H1–H4. If the config was built from a profile with wrong/missing obfuscation params, handshake will fail. Use `get_obfuscation_from_node` or ensure ServerProfile `request_params` match the running container.
5. **System operator seeded**: Admin "Issue config" (standalone) uses `system_operator_not_seeded` if User tg_id=0 and Plan "operator" subscription are missing. Fix: `./manage.sh seed-operator` (after migrations).

## Reviewing AmneziaWG instances

- **What they are**: External Docker containers named `amnezia-awg*` (not in docker-compose). Control-plane discovers them and stores each as a row in `servers`.
- **CLI**: `./manage.sh node-sync` — discover running containers and sync to DB; `./manage.sh node-list` — list all (id, name, region, status, health_score, draining, api_endpoint); `./manage.sh node-check <server_id>` — health, latency, peer count for one node.
- **API** (authenticated): `GET /api/v1/cluster/topology`, `GET /api/v1/cluster/nodes` (optional `?status=healthy`), `GET /api/v1/cluster/health`.
- **Admin UI**: Servers page lists AmneziaWG nodes with status. Ensure `NODE_MODE=real` and admin-api has access to Docker socket for discovery and peer ops.

## Server sync (snapshot from node)

- **Manual sync**: `POST /api/v1/servers/{server_id}/sync` with body `{ "mode": "manual" }` (RBAC: servers:write). Returns `request_id` and `job_id`. Sync fetches peers/health from node, writes `server_snapshots`, updates `Server` (status, health_score, last_snapshot_at). On failure returns 502 with request_id.
- **Job status**: `GET /api/v1/servers/{server_id}/sync/{job_id}` returns status (pending|running|completed|failed), started_at, finished_at, error. All syncs are audited with request_id.
- **Auto-sync**: Backend loop runs when `SERVER_SYNC_INTERVAL_SECONDS` > 0 (default 60); jitter 0–15s; max concurrency `SERVER_SYNC_MAX_CONCURRENT` (5); per-server exponential backoff on failure (cap `SERVER_SYNC_BACKOFF_MAX_SECONDS`). Metrics: `vpn_server_sync_total`, `vpn_server_sync_latency_seconds`, `vpn_server_snapshot_staleness_seconds`. See `docs/admin-servers-operator-console-design.md` for full plan.

## Bandwidth monitoring (bandwhich)

- **Cause**: `bandwhich` is not in default Debian/Ubuntu repos.
- **Fix**: Install from source (`cargo install bandwhich`) or use `nload`, `vnstat`, or host `cat /proc/net/dev` for interface bytes.

## AmneziaVPN client: ErrorCode 1200 / QFile "failed to open file"

- **Cause**: Error comes from the **AmneziaVPN desktop app** (Qt), not from the control-plane or AmneziaWG server. The client failed to open a file (config, cache, or app data). Often seen in "Поделиться VPN" (Share VPN) when Server/Protocol are empty — the app may be failing to read its stored server list or config.
- **Fix (client-side)**: (1) Check app data folder permissions (e.g. `%AppData%\AmneziaVPN` on Windows, `~/Library/Application Support/` on macOS). (2) Run the app as administrator once if it writes to a protected path. (3) Clear app data/cache and re-import the .conf from the panel (Download .conf from admin, then Import in the app). (4) Reinstall AmneziaVPN if the app data is corrupted. (5) Ensure no antivirus or sandbox is blocking file access. The control-plane only provides config content via download URL; it does not pass file paths to the client.

## CPU usage high / VPN servers unstable

**Causes:**
- **node-agent** (15s heartbeat, 10s actions poll, frequent `docker exec wg show`) can use 20–40% CPU on busy hosts.
- **cadvisor** (monitoring profile) scans Docker containers every 30s; known CPU-heavy.
- **Loki** crash-looping adds retry pressure on Promtail and Prometheus; can degrade stability.
- **kill-amnezia-wg-no-peers.sh** stops containers with 0 peers; if run too often, can cause brief disconnects.

**Fixes:**
1. **Throttle node-agent:** Set `HEARTBEAT_INTERVAL_SECONDS=30` and `ACTIONS_POLL_INTERVAL_SECONDS=30` in node-agent env (`.env` or `docker-compose` environment).
2. **Disable monitoring when not needed:** `./manage.sh down-monitoring` — stops cadvisor, Prometheus, Grafana, Loki, Promtail.
3. **Fix Loki:** Check `docker compose logs loki`; common: disk space, memory. Consider increasing Loki memory limit or disabling if not needed.
4. **Disable server auto-sync:** Set `SERVER_SYNC_INTERVAL_SECONDS=0` in `.env` (control-plane only; does not affect agent heartbeat).
5. **Do not cron `kill-amnezia-wg-no-peers.sh`** frequently; use sparingly or only during low traffic.

## AmneziaVPN Mac client: server-side factors (research)

Based on Amnezia docs and [amnezia-client GitHub issues](https://github.com/amnezia-vpn/amnezia-client/issues):

| Factor | Effect | Mitigation |
|--------|--------|------------|
| **macOS IPv4/IPv6 Address bug** (issue #1630) | Config with `Address = ipv4/32, ipv6/128` in [Interface] fails on Mac: "Failed to set IPv4: Destination address required". Same config works on Windows/iOS. | vpn-suite does not emit `Address` in [Interface]; only PrivateKey, DNS. If server/protocol ever assigns client Address, use IPv4-only to avoid this bug. |
| **Error 1000** | "Config from external source" (e.g. configs created without Amnezia control panel) can trigger this. | Ensure .conf format matches Amnezia expectations: `.conf`/`.vpn`, valid INI, Endpoint as IPv4 or hostname. |
| **Error 1100/1103** (ApiConfigDownload/Timeout) | Client cannot reach server to fetch config. | Correct `vpn_endpoint` (public IP:port), firewall UDP open, config download URL reachable. |
| **Error 900** (ImportInvalidConfigError) | Incomplete/invalid/malformed config. | Re-issue config; ensure no truncation, correct key format, valid obfuscation params. |
| **Handshake failure** | Peer not on server, wrong Jc/Jmin/Jmax/S1/S2/H1–H4, endpoint unreachable. | Add peer to node, match obfuscation with running container, verify UDP port and firewall. |
| **Connection → crash (SIGSEGV)** | Client crashes during connect→disconnect (Qt socket race). Often triggered when connection fails. | Fix server-side causes above so connection succeeds; client bug may still need Amnezia fix. |

Error 1200 is not in [official Amnezia error codes](https://amneziavpn.org/troubleshooting/error-codes/); likely internal Qt. Server can indirectly contribute (bad config → client parse/save failure → QFile/crash).
