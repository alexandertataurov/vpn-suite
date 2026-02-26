# VPN connection configuration test stand

**Purpose:** (1) Get a VPN config file from the server (issue flow), (2) Use that config in a test stand to connect to the internet (WireGuard up → curl → verify).

Validates VPN-related settings and config builder; emits **debug logs** for troubleshooting.

## Full test (get config + handshake + traffic)

From repo root, one command does both steps and **confirms handshake and traffic** using a local WG server (no real VPN node needed):

```bash
./scripts/run_vpn_test_stand_full.sh
```

- **Step 1:** Issue all 3 configs in container; write to `.tmp-vpn-test-stand/` (issued_awg.conf, issued_wg_obf.conf, issued_wg.conf, **server_private.key**).
- **Step 2:** `run_vpn_connectivity_local.sh` starts a local WG server container with that key, adds the issued client as peer, starts a client container with the plain WG config (endpoint = server container). Result: **handshake confirmed** and **curl ifconfig.me** succeeds (traffic via VPN).

If `server_private.key` is missing (old run), the script falls back to host `wg-quick` or Docker remote connectivity (handshake may fail if peer is not on the real server).

## Run (recommended: via manage.sh)

From repo root (uses admin-api container and `.env` from compose):

```bash
./manage.sh test-stand
```

To also write logs to a file inside the container (path is in container):

```bash
TEST_STAND_LOG=/tmp/vpn_debug.log ./manage.sh test-stand
```

## Run (standalone in backend)

From backend with project deps installed (e.g. `pip install -r requirements.txt` or use project venv):

```bash
cd backend
python scripts/test_stand_vpn_config.py
```

Options:

- `--log-file PATH` — also write logs to a file (e.g. `--log-file /tmp/vpn_debug.log`).
- `--no-env` — do not load `.env` from repo root (use current environment only).

Exit code: `0` if all checks pass, `1` otherwise.

## Run (pytest, with captured logs)

From backend:

```bash
cd backend
pytest tests/test_stand_vpn_connection.py -v -s --log-cli-level=DEBUG
```

Use `-s` so stdout is shown; use `--log-cli-level=DEBUG` so debug logs appear. Pytest captures logs for failed tests automatically.

## Issue check (server issues correct config)

With `--issue` the test stand also verifies that the server can **issue a valid client config** (creates a test user/sub/server in DB, calls `issue_device`, validates returned `config_wg` has [Interface], [Peer], Endpoint, AllowedIPs). Requires DB (e.g. run in container with postgres).

```bash
./manage.sh test-stand   # with --issue: add TEST_STAND_ISSUE=1
```

Or in container:

```bash
docker compose run --rm -e PYTHONPATH=/app admin-api python scripts/test_stand_vpn_config.py --no-env --issue
```

## Three config types

The server issues three configs; the test stand validates and can write all of them:

| Type            | File               | Use case                          |
|-----------------|--------------------|-----------------------------------|
| **AmneziaWG**   | `issued_awg.conf`  | AmneziaWG client (obfuscation)     |
| **WG+obfuscation** | `issued_wg_obf.conf` | WG with obfuscation params (Jc, S1, S2, …) |
| **Plain WG**    | `issued_wg.conf`  | Standard WireGuard (`wg-quick`)    |

Only **Plain WG** can be used with `wg-quick` for the connectivity script. AmneziaWG and WG+obf require an AmneziaWG-capable client for a real tunnel test.

## Connectivity (internet via VPN)

To verify that a client **connects to the internet via VPN** using an issued config:

1. Issue a config (admin UI or API) and save the `.conf` content to a file.
2. On a host with WireGuard installed, run (as root):

```bash
sudo ./scripts/vpn_connectivity_check.sh /path/to/client.conf
```

Optional: set `EXPECTED_EXIT_IP` to the VPN server’s public IP to assert traffic exits via VPN:

```bash
sudo EXPECTED_EXIT_IP=185.139.228.171 ./scripts/vpn_connectivity_check.sh /path/to/client.conf
```

Requires: `wireguard-tools`, `curl`, root.

## What is checked

1. **App settings** — `NODE_MODE`, `NODE_DISCOVERY`, `VPN_DEFAULT_HOST`, `AGENT_SHARED_TOKEN` (when `NODE_MODE=agent`).
2. **Config builder** — keypair generation and `build_config()` for profile `universal_safe` (required [Interface]/[Peer], Endpoint).
3. **With --issue** — `issue_device()` returns valid `config_wg` (sections and Endpoint present).

All steps are logged at DEBUG so you can trace failures (e.g. missing env, invalid endpoint, key validation).

**Troubleshooting:** If postgres is unhealthy when running `./manage.sh test-stand` with `TEST_STAND_ISSUE=1`, check `docker compose logs postgres`. "No space left on device" means free disk space (or prune volumes); then wait for postgres to become healthy and re-run.
