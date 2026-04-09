# Config Generation Contract

All WireGuard / AmneziaWG `.conf` emission MUST go through the canonical builder in `apps/admin-api/app/core/config_builder.py`. No exceptions.

## Profiles

| Profile | Description |
|---------|-------------|
| `wireguard_universal` | Pure WireGuard, no AWG. Use when server is plain WireGuard. |
| `awg_legacy_or_basic` | AWG docs-table keys: I1–I5, S1/S2, Jc/Jmin/Jmax. |
| `awg_2_0_asc` | AWG 2.0 ASC keys: J*, S1–S4, H1–H4, I1–I5. |
| `mobile_optimized` | Same as awg_2_0_asc, tuned (lower Jc/Jmax, MTU 1280). |
| `wg_obf` | AWG-compatible config labeled for WG-with-obfuscation clients; uses awg_* rules. |

## Required Fields

Config generation **rejects** (ValueError) if any is missing or invalid:

- **[Interface].PrivateKey** — base64, 43–44 chars
- **[Interface].Address** — CIDR (e.g. 10.8.1.2/32), validated via IP parser
- **[Peer].PublicKey** — base64, 43–44 chars
- **[Peer].Endpoint** — host:port, port 1–65535, IPv6 must be `[addr]:port`
- **[Peer].AllowedIPs** — non-empty, comma-separated CIDR list

## AWG Keys (Profile-Gated)

- `awg_legacy_or_basic`: I1–I5, S1/S2, Jc/Jmin/Jmax
- `awg_2_0_asc`: Jc/Jmin/Jmax, S1–S4, H1–H4, I1–I5

## Constraints

- **Jmin ≤ Jmax** — rejected otherwise
- **S1 + 56 ≠ S2** — AmneziaWG kernel requirement
- **Zero-value omission** — Any optional obfuscation value `<= 0` is omitted

## Output Normalization

- UTF-8, no BOM
- LF line endings only
- One blank line between [Interface] and [Peer]
- Trailing newline
- Deterministic key ordering

## No comments or dates in config

- Config text **MUST NOT** include any comment lines, `# Generated`, `; …`, or date/year headers. The generator emits only `[Interface]`, key-value lines, `[Peer]`, and key-value lines.
- Download filename for one-time config download **MUST** be `client.conf` (no year or date in the filename). Uniqueness is by one-time token only; no date/year in config content or attachment name.
- Canonical structure (source of truth): `[Interface]` with PrivateKey, Address, DNS, optional MTU, optional AmneziaWG keys (Jc, Jmin, Jmax, S1, S2, H1–H4, …); then `[Peer]` with PublicKey, optional PresharedKey, Endpoint, AllowedIPs, PersistentKeepalive. No other lines.

## Endpoint Resolution (Priority Order)

1. **client_endpoint** — Optional override in admin Issue Config modal or request body
2. **server.vpn_endpoint** — Stored on server (set via Admin, topology sync, or auto-derived)
3. **request_params.client_endpoint** — From ServerProfile
4. **Auto-derive from live node** — When runtime adapter available: uses public `endpoint_ip:listen_port` if node reports public IP; otherwise uses `VPN_DEFAULT_HOST:listen_port` when `VPN_DEFAULT_HOST` is set. Persists to `server.vpn_endpoint` for future use.

## Call Sites

- `apps/admin-api/app/core/amnezia_config.py` — `build_amnezia_client_config`, `build_standard_wg_client_config`
- `apps/admin-api/app/services/issue_service.py` — bot/webapp flow
- `apps/admin-api/app/services/admin_issue_service.py` — admin issue/rotate

## Migration Notes

### What Changed

1. **Address required** — Previously some configs could omit Address; now hard fail if missing. Callers use `derive_address_from_profile(request_params)`.
2. **AWG keys gated by profile** — H3/S3/S4/I1–I5 are only allowed in `awg_2_0_asc`.
3. **Zero values omitted** — `S1 = 0`, `S2 = 0`, `H1 = 0`, etc. are no longer written; line is omitted.
4. **Single emission path** — All `.conf` output goes through `config_builder.build_config()`.
5. **Strict validation** — Invalid AllowedIPs/CIDR/Endpoint now hard-fail.
6. **New profile type** — `wg_obf` issues AWG-compatible configs for WG-with-obfuscation clients.

### Rotating Configs

- Re-issue configs via admin or bot. The new format is backward-compatible for clients; only invalid/legacy fields are removed.
- If clients fail import, verify Endpoint and Address are present and AWG values match the server.
