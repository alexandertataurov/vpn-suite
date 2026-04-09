# VPN Suite – Troubleshooting

**Current stack:** admin-api (FastAPI), Postgres, Redis, reverse-proxy, telegram-vpn-bot, node-agent (optional). No PHP/MySQL panel. See [docs/codebase-map.md](../../docs/codebase-map.md) and [docs/ops/runbook.md](../../docs/ops/runbook.md).

## Bot cannot reach admin-api

- **Cause:** Wrong URL or not on shared network. Bot must use the internal service name so DNS resolves on the Docker network.
- **Fix:** Set bot API base URL to admin-api (e.g. `http://admin-api` or as in .env/compose). Ensure both services use the same Docker network. If you see "Temporary failure in name resolution", fix the URL and recreate the bot container.

## Bot build fails (context / path)

- **Cause:** Dockerfile build context or COPY paths don't match compose `context`/`dockerfile`.
- **Fix:** In Dockerfile use paths relative to the compose build context (e.g. `apps/telegram-bot/` if context is repo root). Check compose config for `context` and `dockerfile`.

## Healthcheck failing (bot / admin-api / postgres)

- **Bot:** Ensure health endpoint (e.g. `/healthz`) returns 200; healthcheck runs inside container. Increase `start_period` if bot starts slowly.
- **admin-api:** Ensure readiness/liveness endpoints return 200; postgres and Redis must be up.
- **postgres:** Use postgres image healthcheck (e.g. pg_isready); admin-api depends on `condition: service_healthy` where configured.

## Services not resolving each other by name

- **Cause**: Service not on `vpn-suite` network or compose project mismatch.
- **Fix**: All services in `docker-compose.yml` must have `networks: - vpn-suite`. Start with same project: `./manage.sh up-all` (or both profiles). Check `docker network inspect vpn-suite`.

## Postgres connection refused / migration errors

- **Cause:** DB not healthy yet, wrong host/port, or migration order.
- **Fix:** admin-api uses `DATABASE_URL` (host `postgres` inside compose). Run `./manage.sh migrate` after postgres is healthy. Check postgres logs and `./manage.sh config` for env.

## Prometheus / Grafana not scraping or no data

- **Cause:** Scrape targets use service names; monitoring stack and targets must be on the same network and up.
- **Fix:** Confirm `config/monitoring/prometheus.yml` has correct job names and hostnames. Start with `./manage.sh up-monitoring` (or docker-compose.observability.yml); check Prometheus targets UI and Grafana datasource.

## Rollout / rollback

- **Rollout:** Backup first: `./manage.sh backup-db`. Deploy new stack (e.g. `./manage.sh up-core`), run migrate if needed, verify health and `./manage.sh smoke-staging` if applicable.
- **Rollback:** Document rollback path before rollout. Restore from backup if needed (`./manage.sh restore-db`); see [docs/ops/runbook.md](../../docs/ops/runbook.md).

## Volume or permission errors

- **admin-api / bot / node-agent:** Ensure compose volume mounts and env point to valid paths; container user must have read/write where required. Check `docker compose config` and logs.

## amnezia-awg not starting or no VPN handshake

- **Cause**: AmneziaWG (metaligh/amneziawg) needs NET_ADMIN, `/dev/net/tun`, and correct UDP port (47604). Volume at `/etc/amnezia/amneziawg` must be initialized (see docs/AMNEZIAWG_DPI.md).
- **Fix**: Verify `cap_add: NET_ADMIN`, `devices: /dev/net/tun`, port `47604:51820/udp`, and volume `amnezia_awg_data:/etc/amnezia/amneziawg`. Check `docker logs amnezia-awg`; init config with `awguser`/`awgstart` inside the container.

## amnezia-awg: "Unknown device type" / "Missing WireGuard (Amnezia VPN) kernel module"

- **Cause**: The container kernel has no `amneziawg` module; `ip link add awg0 type amneziawg` fails. The entrypoint falls back to the userspace implementation (amneziawg-go), then brings the interface up with `awg setconf`; the interface can still work (log may say "interface up (kernel mode)").
- **Fix (optional, for better performance)**: Install the AmneziaWG kernel module on the **host** (if the container shares the host kernel) or use an image that includes it. Build/install from: https://github.com/amnezia-vpn/amneziawg-linux-kernel-module . If you keep the userspace fallback, no action required—VPN can work.

## Sync peers (AmneziaWG)

- **Note:** With node-agent, peers are reconciled on the host. With Docker mode, control-plane adds peers via Docker runtime. See [docs/ops/amneziawg-obfuscation-runbook.md](../../docs/ops/amneziawg-obfuscation-runbook.md).

## Docker socket not available

- **Cause:** Process that runs `docker exec` (e.g. admin-api) needs Docker socket access; host socket is often `root:docker` (660).
- **Fix:** Set `DOCKER_GID` in `.env` to host docker GID; recreate service. Prefer **agent mode** (node-agent on each host) in production.

## VPN: No traffic (DPI blocking)

- **Cause**: In some regions (e.g. Russia), DPI blocks un-obfuscated VPN traffic; you see “connected” but no traffic.
- **Fix**: The stack uses AmneziaWG (metaligh/amneziawg) only. Choose **AmneziaWG** or **AmneziaVPN** in the app. See **docs/AMNEZIAWG_DPI.md**.

## VPN: AmneziaWG configs

- **Cause**: The panel and bot issue full AmneziaWG client configs (real WG keypairs + obfuscation Jc, Jmin, Jmax, S1, S2, H1–H4 from server profile or defaults). The stack runs **metaligh/amneziawg** only.
- **Fix**: In Admin **VPN servers** set **public_key** (from container after `awguser`/`awgstart`) and **vpn_endpoint** (e.g. `vpn.example.com:47604`). Or set `VPN_DEFAULT_HOST=vpn.example.com` in `.env` so Issue Config auto-derives endpoint from the live node's listen_port. Optionally set a server profile with `request_params` (amnezia_jc, amnezia_jmin, amnezia_jmax, amnezia_s1, amnezia_s2, amnezia_h1–h4, client_endpoint, dns). Users choose **AmneziaWG** or **AmneziaVPN** in the app.

## VPN: users cannot connect (VPN server)

- **Cause:** Control-plane must have the server's live public key; peers must exist on the node. With agent mode, node-agent reconciles peers; key comes from heartbeat.
- **Fix:** (1) Ensure server key is in DB: run `./manage.sh server:sync <server_id>` if key unknown (409 SERVER_NOT_SYNCED on issue/reissue). (2) Set **vpn_endpoint** (host:port) and ensure UDP is open on host/firewall. (3) With node-agent, ensure desired state includes the peer; with Docker mode, peer is added via control-plane. See [docs/ops/amneziawg-obfuscation-runbook.md](../../docs/ops/amneziawg-obfuscation-runbook.md).

## VPN: connected but no internet / no traffic

- **Full checklist**: See [docs/ops/no-traffic-troubleshooting.md](../../docs/ops/no-traffic-troubleshooting.md) — server peer AllowedIPs must be client tunnel address (/32), not 0.0.0.0/0.
- **Deep debug (handshake OK, no traffic)**: Same doc, section **Deep debug (AmneziaWG in Docker)** — problem classification, mandatory diagnostics (wg show, ip_forward, NAT, Docker network mode, MTU, tcpdump), "request 3 things" for remote support, and minimal fix plan.
- **Peers not on server**: With AmneziaWG, peers are added in the container via `awguser`/`awgstart`; panel Sync and `./scripts/sync-vpn-peers.sh` do not apply. If devices were synced from bot with `public_key='synced'`, get a new config from the bot (Install VPN / Get config) so the panel has a real key; then add that peer in the container. For add-vpn-peer.sh: it detects AmneziaWG and prints that peers must be added via the container.
- **Firewall**: Host must allow **UDP 47604** for VPN. Run: `ufw allow 47604/udp` then `ufw status`.
- **NAT/forward in container**: The AmneziaWG container (metaligh/amneziawg) handles forwarding; ensure `ip_forward=1` and NAT inside the container per image docs.
- **Check**: Run `./scripts/debug-vpn.sh`; for AmneziaWG, section 5b shows a note that wg CLI is not available and to use awguser/awgstart.

## Admin: issue config / rotate / revoke

- **Issue fails (409 SERVER_NOT_SYNCED):** Server's live public key not in DB. Run `./manage.sh server:sync <server_id>` then retry. In agent mode, key comes from node-agent heartbeat.
- **Issue fails (502 / server unreachable):** With Docker mode ensure Docker socket and node are available. With agent mode ensure node-agent is running and server is healthy.
- **Config download 404/410:** One-time token expired or already consumed. Issue or reissue config from admin UI.
- **Audit:** Correlate by `request_id` or `resource_id` (server_id); see audit API and admin Audit page.

## Admin peer: cannot connect (server-side)

When a device fails to connect, verify server-side:

1. **Peer on node:** Public key must exist on the node. With agent mode, node-agent reconciles; with Docker mode, issue flow adds peer. Check node (e.g. `wg show` or node-agent logs).
2. **NODE_MODE=agent:** Control-plane does not add peers; node-agent does. Ensure device is in desired state and node-agent has run reconcile.
3. **Endpoint/port:** Server `vpn_endpoint` must match actual host:port; firewall must allow UDP.
4. **Obfuscation match:** AmneziaWG needs matching Jc/Jmin/Jmax/S1/S2/H1–H4; ensure server profile `request_params` match the running node. See [docs/ops/amneziawg-obfuscation-runbook.md](../../docs/ops/amneziawg-obfuscation-runbook.md).
5. **Operator seeded:** If issue requires operator user/plan, run `./manage.sh seed-operator` (or equivalent seed) after migrations.

## Reviewing servers (nodes)

- **What they are:** Servers are rows in Postgres; in Docker discovery mode they map to AmneziaWG containers; in agent mode they are registered by node-agent (heartbeat).
- **CLI:** `./manage.sh server:verify <server_id>`, `./manage.sh server:sync <server_id>`, `./manage.sh server:drift <server_id>`, `./manage.sh server:reconcile <server_id>`. See README and [docs/ops/runbook.md](../../docs/ops/runbook.md).
- **API:** e.g. `GET /api/v1/servers`, `GET /api/v1/cluster/topology`, cluster health — see OpenAPI `openapi/openapi.yaml`.
- **Admin UI:** Servers page lists servers and status. Agent mode: no Docker socket on control-plane; node-agent on each host.

## Server sync (key / snapshot from node)

- **CLI:** `./manage.sh server:sync <server_id>` — syncs server key and optionally snapshot from node to DB. Required before issue/reissue if server was never synced (avoids 409 SERVER_NOT_SYNCED).
- **API:** `POST /api/v1/servers/{server_id}/sync` (if implemented) and job status endpoints; see OpenAPI. Backend may run auto-sync when enabled; metrics and intervals in backend config and [docs/observability/](../../docs/observability/).

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
