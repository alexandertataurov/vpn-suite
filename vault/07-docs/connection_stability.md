## VPN connection stability and restrictive profile

This document explains how to diagnose and improve AmneziaWG/WireGuard tunnel stability in "hard" networks (aggressive NAT, high jitter, UDP filtering).

### 1. Baseline expectations

- Client configs issued by `admin-api` use:
  - `MTU=1200` (restrictive default).
  - `PersistentKeepalive=10` on the client side.
  - IPv4+IPv6 full tunnel by default: `AllowedIPs = 0.0.0.0/0, ::/0`.
  - DNS: `1.1.1.1, 1.0.0.1, 8.8.8.8, 8.8.4.4`.
- Server peers created on the node use:
  - client /32 or /128 as `AllowedIPs` on the node.
  - server keepalive ~15s by default.

### 2. Quick stability checklist

When a user reports "VPN is on but nothing works" or "works 2–3 minutes then freezes":

1. On the node container (`amnezia-awg`):
   - `docker exec amnezia-awg wg show awg0`
   - Confirm for the device:
     - `latest handshake` is recent (≤ 20–30 seconds) when the client is active.
     - `transfer: rx/tx` increases while the user is sending traffic.
2. On the host:
   - `sysctl net.ipv4.ip_forward` must be `1`.
   - NAT and routes:
     - `iptables -t nat -L POSTROUTING -n -v | grep 10.8.1` (or `nft list ruleset`).
     - `ip route | grep 10.8.1.0/24` and ensure it points to `awg0`.

Interpretation:

- Handshake missing or very old → NAT/power-saving/connectivity problem.
- Handshake OK but `rx/tx` almost not growing → routing/NAT/MTU/DNS problem.

### 3. Restrictive profile (IPv4-only, lower MTU, aggressive keepalive)

For unstable regions, use a restrictive connection profile:

- IPv4-only full tunnel:
  - Server profile: set `disable_ipv6_on_unstable_route=true`.
  - Resulting client config: `AllowedIPs = 0.0.0.0/0` (no `::/0`).
- Lower MTU:
  - Use the `mtu_probe` helper (`apps/admin-api/scripts/mtu_probe.py`) to find a safe MTU and store it in the server profile.
- Keepalive:
  - Client keepalive fixed to 10 seconds; server peer keepalive ~15 seconds.

Devices created from such a profile are tagged with `connection_profile="restrictive"` in the DB.

### 4. Automatic NO_HANDSHAKE detection and unstable flags

The control plane tracks devices that never established a handshake:

- Telemetry polling:
  - Writes per-device telemetry into Redis (handshake timestamp, age, rx/tx, peer presence).
  - Exposes Prometheus metric `vpn_peer_last_handshake_age_seconds{device_id,server_id}`.
- Handshake quality gate task:
  - Periodically scans devices with `apply_status=APPLIED` and `last_applied_at` older than a configurable gate.
  - If no handshake has ever been observed for such a device, it:
    - Sets `apply_status=NO_HANDSHAKE`.
    - Sets `last_error="no_handshake_within_gate"`.
    - Sets `unstable_reason="no_handshake_within_gate"`.
    - Increments `vpn_peer_unstable_events_total{reason="no_handshake_within_gate"}`.

These fields and metrics let operators quickly find devices that never came up and decide whether to reissue configs with a restrictive profile.

### 5. Operator actions for unstable devices

When a device is marked as `NO_HANDSHAKE` with `unstable_reason`:

- Check server prerequisites (port, forward, NAT, routes, MTU) using the checklist above.
- If server-side is healthy and the region is known to be unstable:
  - Reissue the config under a restrictive profile:
    - IPv4-only (`disable_ipv6_on_unstable_route=true`).
    - Safe MTU from `mtu_probe` (for example 1180 or 1160).
    - Keepalive 10 seconds.
- Ask the user to:
  - Turn off power saving for the VPN app.
  - Keep the device screen on during testing to avoid Wi‑Fi sleep.

### 6. Prometheus and alerts

Suggested Prometheus rules:

- Alert when a significant number of devices have no handshake:
  - `vpn_devices_no_handshake > 0` for longer than a few minutes.
- Alert when per-device handshake age is too high for new devices:
  - `vpn_peer_last_handshake_age_seconds{device_id=...,server_id=...} > 60`.

These signals, combined with logs (`event="handshake_seen"`, `event="no_handshake_marked"`), provide a full picture of tunnel health.
