# AmneziaWG obfuscation runbook (production)

## Why this matters

AmneziaWG uses obfuscation parameters (Jc, Jmin, Jmax, S1, S2, H1–H4) to reduce DPI fingerprinting. **Client and server must agree** on S1, S2, H1–H4; otherwise handshake or traffic can fail or become detectable.

## Rule: S1, S2, H1–H4 must match the server

- **S1, S2, H1–H4**: Must be identical on the server and in every issued client config.
- **Jc, Jmin, Jmax**: Can differ between client and server; panel defaults are 4, 64, 1024.

## How the panel gets obfuscation (reverse sync: server is source of truth)

1. **Runtime sync**: Issued configs use H1–H4 (and S1, S2, Jc, etc.) from the AmneziaWG server when available:
   - **NODE_DISCOVERY=docker**: `get_obfuscation_from_node` runs `docker exec <node> wg show <iface>` and parses output.
   - **NODE_DISCOVERY=agent**: Node-agent includes `obfuscation` (from `wg show <iface>`) in heartbeat; control-plane reads it from Redis and uses it for issuance.
2. **Fallback**: If the adapter has no obfuscation (e.g. no heartbeat yet, or node unreachable), profile/DB defaults are used.
3. **ServerProfile request_params**: DB fields amnezia_jc, amnezia_jmin, amnezia_jmax, amnezia_s1, amnezia_s2 (amnezia_h1–h4 from profile are stripped; H always from node when available).
4. **Defaults (client config)**: Jc=4, Jmin=64, Jmax=1024, S1=S2=H1=H2=H3=H4=0. H3 is only emitted in `awg_2_0_asc` profiles when non-zero.

## Server [Interface] obfuscation (amnezia-awg2)

The amnezia-awg2 entrypoint supports optional env vars that are written into the server `[Interface]` section. When set, they must match ServerProfile `request_params` or the values reported by `get_obfuscation_from_node` for issued client configs.

- **Env vars**: `AWG_Jc`, `AWG_Jmin`, `AWG_Jmax`, `AWG_S1`, `AWG_S2`, `AWG_H1`, `AWG_H2`, `AWG_H3`, `AWG_H4`. Leave unset to use the binary default (no line written).
- **Where**: Set in docker-compose `environment` or in `.env` for the amnezia-awg service. See `amnezia/amnezia-awg2/.env.example`.

## Troubleshooting: AmneziaWG logging

AmneziaWG (amneziawg-go) respects the `LOG_LEVEL` environment variable (e.g. `debug` for verbose output). In amnezia-awg2, set `AWG_LOG_LEVEL=debug` in the container environment (or in `.env` as `AWG_LOG_LEVEL=debug`) and restart the service to diagnose handshake or DPI issues. Do not leave debug enabled in production.

## Verification (each node / after image change)

1. Run: `docker exec <amnezia-awg-container> wg show <iface>`
2. Confirm output includes Jc, Jmin, Jmax, S1, S2, H1–H4.
3. Ensure ServerProfile or runtime sync use the same S1, S2, H1–H4 for issued configs.

## High-DPI (e.g. Russia)

For regions with aggressive DPI, set ServerProfile `request_params` so issued client configs match the server:

- **amnezia_s1**, **amnezia_s2**, **amnezia_h1**–**amnezia_h4**: Must match the server (either from `get_obfuscation_from_node` or from server env when using amnezia-awg2 optional obfuscation env).
- Optionally **amnezia_jc**, **amnezia_jmin**, **amnezia_jmax** (panel defaults 4, 64, 1024 are usually fine).
- When the server uses `AWG_S1`, `AWG_S2`, `AWG_H1`–`AWG_H4` in amnezia-awg2, keep ServerProfile in sync so runtime sync or profile-based issue both emit the same values.

## H1–H4 rotation and sync (admin-api ↔ AmneziaWG)

When H keys need to be rotated, the control-plane is the source of truth; the AmneziaWG container must get the same values (AWG_H1–AWG_H4).

**1. Rotate from Admin API**

- **POST** `/api/v1/servers/{server_id}/rotate-obfuscation-h` (servers:write): generates new H1–H4 with CSPRNG, saves them on the Server row, and enqueues an action `apply_obfuscation_h` for the node-agent. Response: `{ "h1", "h2", "h3", "h4", "action_id" }`.

**2. Desired-state (sync with admin-api at every step)**

- **GET** `/api/v1/agent/desired-state?server_id=...` (X-Agent-Token) returns:
  - **peers**: `public_key`, `allowed_ips`, `preshared_key` (from Device) so node-agent applies the correct peer and PSK when reconciling.
  - **obfuscation_h**: `{ h1, h2, h3, h4 }` when the server has all four set.
  - **obfuscation_full**: `{ s1, s2, jc, jmin, jmax, h1, h2, h3, h4 }` from Server + first ServerProfile `request_params`. When present, node-agent (if `AMNEZIA_NODE_ENV_PATH` is set) updates the node env file with AWG_S1, AWG_S2, AWG_Jc, AWG_Jmin, AWG_Jmax, AWG_H1–H4 and restarts AmneziaWG so issued configs always match the node.
- Flow: **Admin issues config** → Device saved in DB (public_key, allowed_ips, preshared_key) → **node-agent** pulls desired-state → reconciles peers (add/update with preshared_key) → if obfuscation_full present, syncs to node env and restarts AWG. **AmneziaWG** entrypoint PostUp adds route `10.8.1.0/24 dev awg0` so reply traffic reaches clients. New configs work without manual steps.

**3. Sync to node (pick one)**

- **Option A — Host script (cron):** On the VPN host, run periodically:
  ```bash
  cd /opt/amnezia/amnezia-awg2
  CONTROL_PLANE_URL=... SERVER_ID=... AGENT_SHARED_TOKEN=... \
    bash /opt/vpn-suite/ops/sync-amnezia-h-from-control-plane.sh
  ```
  The script GETs desired-state, updates `secrets/node.env` with AWG_H1–H4 if different, and restarts the AmneziaWG stack. Use cron (e.g. every 5 min) for automatic sync after rotation.

- **Option B — Node-agent action:** When node-agent polls and gets action `apply_obfuscation_h` (payload: h1, h2, h3, h4), it updates the file at `AMNEZIA_NODE_ENV_PATH` and restarts the AmneziaWG container. Mount the host’s node.env into the node-agent container and set `AMNEZIA_NODE_ENV_PATH` to that path (e.g. `/run/amnezia/node.env`).

**4. Re-issue configs**

After rotation, existing client configs have old H values. Re-issue configs from Admin (or bot) so new configs get the new H1–H4 from the Server row.

## Production checklist

- Use AmneziaWG (profile_type=awg) as default, not plain WG.
- After upgrading AmneziaWG image, re-verify `wg show` and update ServerProfile if needed.
- Prefer per-server or per-region obfuscation in ServerProfile to reduce single fingerprint.

## Russia / high-DPI regions

Use AmneziaWG obfuscation (Jc, Jmin, Jmax, S1–H4) where WireGuard is blocked or heavily fingerprinted. See profiles and deployment in this runbook.

## References

- **Config Generation Contract**: [[07-docs/specs/config-generation-contract|config-generation-contract.md]] — canonical builder, required fields, verified AWG keys.
- `apps/admin-api/app/services/issue_service.py` (issue_device: runtime obfuscation merge for user-issued configs).
- `apps/admin-api/app/services/node_runtime_docker.py` (get_obfuscation_from_node), `apps/admin-api/app/core/amnezia_config.py` (get_obfuscation_params, build_amnezia_client_config).
