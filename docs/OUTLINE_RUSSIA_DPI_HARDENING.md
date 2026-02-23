# Outline VPN: Hardening for Russia / DPI / Regional Blocking

## Context

Russia uses DPI to fingerprint and block Shadowsocks/VPN traffic. Patterns:
- TCP: 3+ packets of 411+ bytes → encapsulated TLS fingerprint
- UDP/QUIC often less affected
- Port 443 (HTTPS) is least likely to be blocked
- IP blocklists: changing domain easier than migrating server

## Implemented Hardening

### 1. Port 443 (Recommended)

Running Outline on port 443 reduces port-based blocking. Trade-off: Caddy must move to 8443 for admin/API.

- **Before**: Outline 58294, Caddy 80/443
- **After**: Outline 443, Caddy 80/8443 (admin at `https://$PUBLIC_DOMAIN:8443`)

Run: `./scripts/outline-hardening-russia.sh --port-443`

### 2. Domain Hostname

Use domain instead of IP in access keys. If IP gets blocklisted, update DNS only.

```bash
# Via Outline Manager API (from /opt/outline/access.txt)
curl -k -X PUT "https://127.0.0.1:25432/1sBGo-52OBZT7USnJgAJBA/server/hostname-for-access-keys" \
  -H "Content-Type: application/json" -d '{"hostname":"vpn.example.com"}'
```

Then re-issue access keys so clients get the new hostname.

### 3. Replay Protection

Outline enables `--replay_history=10000` by default. Keep it enabled.

### 4. AmneziaWG as Alternative

For users in Russia, AmneziaWG with obfuscation (Jc, Jmin, Jmax, S1–H4) may work when Outline is blocked. See `AMNEZIAWG_OBFUSCATION_RUNBOOK.md`.

## Limitations

- **Outline client** does not support plugins (v2ray-plugin, TLS wrapper). True TLS/WebSocket wrapping requires a different client (e.g. Shadowsocks-Rust + v2ray-plugin).
- **Packet fingerprint**: DPI can detect Shadowsocks handshake patterns. Port 443 + domain reduces detection surface but does not fully obfuscate.
- **UDP vs TCP**: Russia DPI targets TCP more. Outline uses both; no server option to disable TCP.

## Verification

- `gfw.report` (if available) for reachability
- Test from mobile data vs Wi‑Fi vs different ISP
- Monitor `shadowsocks_data_bytes` metrics in Prometheus for connection health
