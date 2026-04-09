# VPN connection configuration test stand

**Purpose:** (1) Get a VPN config file from the server (issue flow), (2) Use that config in a test stand to connect to the internet (WireGuard up → curl → verify).

Validates VPN-related settings and config builder; emits **debug logs** for troubleshooting.

## Scope

The test stand validates config generation and can write issued configs to `.tmp-vpn-test-stand/` for inspection. It no longer provisions or runs a local plain WireGuard server from this repo.

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
cd apps/admin-api
python scripts/test_stand_vpn_config.py
```

Options:

- `--log-file PATH` — also write logs to a file (e.g. `--log-file /tmp/vpn_debug.log`).
- `--no-env` — do not load `.env` from repo root (use current environment only).

Exit code: `0` if all checks pass, `1` otherwise.

## Run (pytest, with captured logs)

From backend:

```bash
cd apps/admin-api
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

Only **Plain WG** can be used with `wg-quick` outside this repo. AmneziaWG and WG+obf require an AmneziaWG-capable client for a real tunnel test.

## What is checked

1. **App settings** — `NODE_MODE`, `NODE_DISCOVERY`, `VPN_DEFAULT_HOST`, `AGENT_SHARED_TOKEN` (when `NODE_MODE=agent`).
2. **Config builder** — keypair generation and `build_config()` for profile `universal_safe` (required [Interface]/[Peer], Endpoint).
3. **With --issue** — `issue_device()` returns valid `config_wg` (sections and Endpoint present).

All steps are logged at DEBUG so you can trace failures (e.g. missing env, invalid endpoint, key validation).

**Troubleshooting:** If postgres is unhealthy when running `./manage.sh test-stand` with `TEST_STAND_ISSUE=1`, check `docker compose logs postgres`. "No space left on device" means free disk space (or prune volumes); then wait for postgres to become healthy and re-run.
