# AmneziaWG obfuscation runbook (production)

## Why this matters

AmneziaWG uses obfuscation parameters (Jc, Jmin, Jmax, S1, S2, H1–H4) to reduce DPI fingerprinting. **Client and server must agree** on S1, S2, H1–H4; otherwise handshake or traffic can fail or become detectable.

## Rule: S1, S2, H1–H4 must match the server

- **S1, S2, H1–H4**: Must be identical on the server and in every issued client config.
- **Jc, Jmin, Jmax**: Can differ between client and server; panel defaults are 4, 64, 1024.

## How the panel gets obfuscation

1. **Runtime sync**: `get_obfuscation_from_node(server_id)` runs `docker exec <node> wg show <iface>` and parses output. Overrides profile defaults.
2. **User-issued (bot) configs**: Same as admin-issued: when a runtime adapter is available, `issue_service.issue_device` calls `get_obfuscation_from_node(resolved_server_id)` and merges the result over ServerProfile defaults, so bot-issued configs match the running node.
3. **ServerProfile request_params**: DB fields amnezia_jc, amnezia_jmin, amnezia_jmax, amnezia_s1, amnezia_s2, amnezia_h1–h4.
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

## Production checklist

- Use AmneziaWG (profile_type=awg) as default, not plain WG.
- After upgrading AmneziaWG image, re-verify `wg show` and update ServerProfile if needed.
- Prefer per-server or per-region obfuscation in ServerProfile to reduce single fingerprint.

## Outline as second protocol (Russia / high-DPI regions)

Outline (Shadowsocks) is complementary to AmneziaWG: use it where WireGuard is blocked or heavily fingerprinted (e.g. Russia). Outline provides AEAD ciphers (mandatory), **replay protection (enabled by default in Outline Server)**, variable packet sizes, and (in the client) optional connection-prefix disguise for regions with active probing (see Outline Server docs/shadowsocks.md). Protection against replayed data is on by default in Outline; keep it enabled. Deploy via `outline/persisted-state/start_container.sh` or `amnezia/outline-server/install.sh`; control-plane integration: `backend/app/services/outline_client.py`. Treat Outline as an alternative protocol, not a replacement for AmneziaWG in the same control plane.

## References

- **Config Generation Contract**: [CONFIG_GENERATION_CONTRACT.md](CONFIG_GENERATION_CONTRACT.md) — canonical builder, required fields, verified AWG keys.
- `backend/app/services/issue_service.py` (issue_device: runtime obfuscation merge for user-issued configs).
- `backend/app/services/node_runtime_docker.py` (get_obfuscation_from_node), `backend/app/core/amnezia_config.py` (get_obfuscation_params, build_amnezia_client_config).
- `.cursor/skills/vpn-suite/troubleshooting.md` (handshake failure, obfuscation match).
