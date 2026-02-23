# VPN: Connected but No Traffic — Troubleshooting

When the client connects (handshake succeeds) but no traffic flows, check the following in order.

## 1. Server peer AllowedIPs (most likely cause)

**WireGuard rule:** On the server, each peer’s `AllowedIPs` must be the **client tunnel IP** (e.g. `10.8.1.2/32`), not `0.0.0.0/0`.  
Using `0.0.0.0/0` for multiple peers causes routing conflicts and can prevent traffic.

**Verify:**
```bash
docker exec <amnezia-awg2> wg show awg0
```
Check that each peer has `allowed ips: 10.x.x.x/32` (client’s tunnel address), not `allowed ips: 0.0.0.0/0`.

**Fix (if wrong):** The panel should pass the client’s `Address` (from the issued config) as `allowed_ips` when adding the peer. If your build does not do this, it must be updated.

## 2. Client config Address vs server subnet

The client config `[Interface] Address` must be inside the server’s tunnel subnet (e.g. `10.8.0.0/24`).  
The server’s `AllowedIPs` for that peer must match the client’s Address.

## 3. Obfuscation mismatch (S1, S2, H1–H4)

If S1, S2, H1–H4 differ between client config and server, the handshake can fail or traffic can be dropped.

**Check:** Compare `docker exec <container> wg show awg0` with the issued config. See [AMNEZIAWG_OBFUSCATION_RUNBOOK.md](AMNEZIAWG_OBFUSCATION_RUNBOOK.md).

## 4. Firewall / NAT

- Host firewall must allow UDP for the VPN port (e.g. 45790 or 47604).
- NAT/forwarding must be enabled (e.g. `ip_forward=1`) and the AmneziaWG container configured for forwarding.

## 5. Endpoint / reachability

- `Endpoint` in the config must be the public IP or hostname clients can reach.
- Port must match the server’s listening UDP port.

## 6. Agent mode: peer on server

With `NODE_MODE=agent`, the control-plane does not add peers; the node-agent does. Ensure:

- The device appears in desired-state for that server.
- Node-agent has reconciled (check its logs).
- The peer exists in the container: `docker exec <container> wg show awg0`.

## Quick checks

| Check | Command / location |
|-------|--------------------|
| Peer on server | `docker exec <amnezia-awg2> wg show awg0` |
| Obfuscation on server | Same `wg show` output |
| Client config Address | Issued .conf `[Interface] Address = ...` |
| Server peer AllowedIPs | Same `wg show` output per peer |
| Firewall | `ufw status` or equivalent |
