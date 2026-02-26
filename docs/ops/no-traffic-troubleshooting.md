# VPN: Connected but No Traffic — Troubleshooting

When the client connects (handshake succeeds) but no traffic flows, check the following in order.

## 1. Server peer AllowedIPs (most likely cause)

**WireGuard rule:** On the server, each peer’s `AllowedIPs` must be the **client tunnel IP** (e.g. `10.8.1.2/32`), not `0.0.0.0/0` or `(none)`.  
Using `0.0.0.0/0` or leaving `(none)` causes routing conflicts and can prevent traffic.

**Auto-update on issue:** When a config is issued (admin or bot), the backend applies `allowed_ips = <client_address>/32` on the node via `wg set <iface> peer <pubkey> allowed-ips <client_ip>/32`. It then verifies with `wg show` that the value was applied; if not, the operation fails. Conflict check: if that `/32` is already assigned to another peer, issue fails with a clear error.

**Verify on server:**
```bash
docker exec <container> wg show awg0
```
(Use your AmneziaWG container name, e.g. `amnezia-awg` or `amnezia-awg2`.)  
Check that each peer has `allowed ips: 10.x.x.x/32`, not `(none)` or `0.0.0.0/0`.

**Fix (if wrong):** Re-issue the config for that device from Admin (Devices → Reissue), or call `POST /api/v1/devices/{device_id}/sync-peer` to re-apply the peer with correct `allowed_ips`. **One-off on server:** If a peer shows `allowed ips: (none)`, set it with `docker exec <container> wg set awg0 peer <PUBKEY> allowed-ips 10.8.1.x/32` (use an unused client address, e.g. 10.8.1.3/32 if 10.8.1.2 is taken). Then restart node-agent so next reconcile doesn’t overwrite from desired-state, or fix the device’s `allowed_ips` in Admin and let node-agent reconcile.

## 2. Client config Address vs server subnet

The client config `[Interface] Address` must be inside the server’s tunnel subnet (e.g. `10.8.0.0/24`).  
The server’s `AllowedIPs` for that peer must match the client’s Address.

## 3. Obfuscation mismatch (S1, S2, H1–H4)

If S1, S2, H1–H4 differ between client config and server, the handshake can fail or traffic can be dropped.

**Check:** Compare `docker exec <container> wg show awg0` with the issued config. The server shows `h1: N, h2: N, ...`; the client config must have matching `H1 = N`, etc. If the server was started with empty `AWG_H1`/`AWG_H2`/… (e.g. amnezia-awg), it typically uses **h1: 1, h2: 2, h3: 3, h4: 4**. Generated configs use the same defaults; reissue if you have an old config with different H values. See [amneziawg-obfuscation-runbook.md](amneziawg-obfuscation-runbook.md).

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

## No handshake at all (latest handshake = 0)

When `docker exec <container> wg show <iface> latest-handshakes` shows **0** for your peer, the server has never completed a handshake. Fix connectivity first; NAT/allowed_ips only matter after handshake.

**Checklist:**

1. **Firewall:** Host and any cloud/VM firewall must allow **inbound UDP** on the VPN port (e.g. 45790). On host: `ufw status` or `iptables -L INPUT -n -v`. Ensure the VPN port is ALLOW.
2. **Endpoint:** Config `[Peer] Endpoint` must be the **public IP or hostname** and **port** clients can reach (e.g. `185.139.228.171:45790`). No typo, correct port.
3. **Server record in Admin:** In Admin → Servers, the server’s **VPN endpoint** and **public key** must match the running node. `docker exec <container> wg show <iface>` shows the server public key; it must equal the key in issued configs.
4. **Key match:** The peer on the server whose **public key** equals your client’s public key (from your config’s PrivateKey) must be the one you expect. In Admin, check the device’s public key; on the server, confirm that key appears in `wg show` and has `allowed ips: <your_address>/32`.
5. **Obfuscation H1–H4:** Server and client must use the same H1–H4. Compare `wg show` (h1, h2, h3, h4) with your config; reissue if the server was restarted with different AWG_H1–H4.
6. **Client actually connecting:** In the VPN app, confirm it shows “Connected” or a recent handshake. If it never connects, the client may be blocked (e.g. mobile carrier, corporate firewall) or the endpoint unreachable.

After handshake appears, if there is still no traffic, see [§1 Server peer AllowedIPs](#1-server-peer-allowedips-most-likely-cause), [§4 Firewall / NAT](#4-firewall--nat), and [Deep debug](#deep-debug-amneziawg-in-docker) (NAT, MTU).

**Optional — MTU 1280 for full tunnel:** For full tunnel (0.0.0.0/0) with obfuscation, try `MTU = 1280` in the client config to avoid fragmentation. In Admin, set the server profile **MTU** to 1280, or pass `mtu` / `amnezia_mtu` in request params when issuing; reissue the config to get the new MTU in the file.

## Quick checks

| Check | Command / location |
|-------|--------------------|
| Peer on server | `docker exec <amnezia-awg2> wg show awg0` |
| Obfuscation on server | Same `wg show` output |
| Client config Address | Issued .conf `[Interface] Address = ...` |
| Server peer AllowedIPs | Same `wg show` output per peer |
| Firewall | `ufw status` or equivalent |

## Verify client peer on server (no traffic)

The **server** must have a **peer** whose public key is the **client’s** public key (derived from the client’s `PrivateKey`), with `allowed ips: <client_address>/32` (e.g. `10.8.1.2/32`).

1. **Get client public key** (from the config’s `[Interface] PrivateKey`):
   ```bash
   echo 'MHWq/m1bGi/V7S+ZsD8xn3dg0JKKWz+OziiJQXFPH14=' | wg pubkey
   ```
2. **On the VPN server** (replace `<container>` with your AmneziaWG container, e.g. `amnezia-awg2`):
   ```bash
   docker exec <container> wg show awg0
   ```
   - Find a peer whose **public key** equals the value from step 1.
   - That peer must have **allowed ips: 10.8.1.2/32** (not `0.0.0.0/0`).
   - If **latest handshake** is (none) or very old: key/PSK/obfuscation/endpoint/firewall issue.
   - If handshake is recent but no traffic: routing/firewall/NAT (e.g. `ip_forward`, MASQUERADE).

3. **If the peer is missing**: With `NODE_MODE=real`, admin-api adds the peer when the config is issued; check admin-api logs for `wg set` errors. With `NODE_MODE=agent`, the node-agent must reconcile; ensure the device is in desired-state and the agent has run.

---

## Deep debug (AmneziaWG in Docker)

Use this section when handshake may exist but **no traffic** flows, especially with AmneziaWG in Docker (e.g. amnezia-awg2). Replace `<container>` with your container name (e.g. `amnezia-awg2` or `amnezia-awg`) and `<iface>` with the interface (typically `awg0`).

### Step 1 — Classify the problem

| Symptom | Focus |
|--------|--------|
| ❌ No handshake at all | Key, endpoint, firewall, obfuscation (see [amneziawg-obfuscation-runbook.md](amneziawg-obfuscation-runbook.md)). |
| ⚠ Handshake present but RX/TX not increasing | AllowedIPs, NAT, Docker network, MTU. |
| ⚠ RX grows, TX does not | Return path / NAT. |
| ⚠ Traffic on tunnel but no internet exit | NAT / forwarding on host. |
| ❌ AllowedIPs mismatch | Server peer must have client `/32` (see [§1. Server peer AllowedIPs](#1-server-peer-allowedips-most-likely-cause)). |
| ❌ NAT missing | MASQUERADE rule on host. |
| ❌ Reply route missing | Host must route client subnet (e.g. `10.8.1.0/24`) via `awg0` so replies reach the client. AmneziaWG entrypoint adds this in PostUp when `AWG_NAT=1`; else run `ip route add 10.8.1.0/24 dev awg0` (or use [amnezia-nat-setup.sh](../../ops/amnezia-nat-setup.sh)). The admin-api now ensures this route on add_peer and reconcile. |
| ❌ Route OK but still failing | If `ip route get 10.8.1.2` shows `dev awg0` but client has no traffic: **Endpoint** in the issued config must be the **public** IP:port (e.g. `185.139.228.171:45790`). Set **server.vpn_endpoint** in Admin → Servers, or set **VPN_DEFAULT_HOST** in `.env` to the public IP; re-issue the config and re-download. Use the AmneziaWG client (obfuscation) with that config. |
| ❌ MTU fragmentation | Full tunnel + obfuscation often needs lower MTU (e.g. 1280). |
| ❌ Docker network isolation | Bridge can break forwarding; host network preferred. |

### Step 2 — Mandatory diagnostics

**A) In container — peer and traffic**

```bash
docker exec -it <container> wg show <iface>
```

Check: peer present, `latest handshake`, `transfer` rx/tx, and **allowed ips: 10.8.1.x/32**. If `allowed ips: (none)` → see [§1](#1-server-peer-allowedips-most-likely-cause).

**B) Interface up**

```bash
docker exec -it <container> ip a
```

Expect `<iface>` (e.g. awg0) with tunnel subnet (e.g. 10.8.1.1/24).

**C) IP forwarding**

In container:

```bash
docker exec -it <container> sysctl net.ipv4.ip_forward
```

On host:

```bash
sysctl net.ipv4.ip_forward
```

Must be `1` in both.

**D) NAT on host**

```bash
iptables -t nat -L -n -v
```

Expect a POSTROUTING rule like:

```
-A POSTROUTING -s 10.8.1.0/24 -o eth0 -j MASQUERADE
```

If absent, traffic will not leave the host. (If using nftables, provide the equivalent nat listing.)

**E) Docker network mode**

```bash
docker inspect <container> | grep -i networkmode
```

Prefer `"NetworkMode": "host"` for WireGuard. Bridge mode can cause forwarding issues.

**F) MTU**

With full tunnel (0.0.0.0/0) and obfuscation, try in the client config:

```
MTU = 1280
```

**G) Traffic on wire**

In container, while pinging from client:

```bash
docker exec -it <container> tcpdump -i <iface>
```

Packets visible → server receives; not visible → client or route issue.

**H) Routes in container**

```bash
docker exec -it <container> ip route
```

Default route should go via the container’s external interface.

### Request from user (remote support)

When someone else is debugging (e.g. you are support), ask for **exactly these three outputs** before diagnosing:

1. **wg show from container:**  
   `docker exec <container> wg show <iface>` (full output).

2. **NAT on host:**  
   `iptables -t nat -L -n -v` from the **host** (or nft equivalent if they use nftables).

3. **Docker network mode:**  
   `docker inspect <container> | grep -i networkmode` or the `HostConfig.NetworkMode` field from `docker inspect <container>`.

### Most likely causes (by frequency)

1. No MASQUERADE rule for the tunnel subnet on the host.
2. AllowedIPs = (none) or wrong on the server peer.
3. Docker bridge instead of host network.
4. MTU fragmentation (full tunnel + obfuscation).
5. Peer mismatch (wrong public key or client never added).

### Minimal fix plan

1. Consider moving the container to **host** network (if it is currently bridge and NAT is correct).
2. **Add NAT on host** (required for client traffic to reach the internet):  
   Run `sudo ./ops/amnezia-nat-setup.sh` (or pass the outbound interface, e.g. `eth0`). This adds MASQUERADE for `10.8.1.0/24` and `10.66.66.0/24`. Or manually:  
   `iptables -t nat -A POSTROUTING -s 10.8.1.0/24 -o <main_interface> -j MASQUERADE` (and same for `10.66.66.0/24` if your AmneziaWG interface uses that subnet).
3. Fix server-side allowed-ips per peer:  
   `wg set <iface> peer <client_pubkey> allowed-ips 10.8.1.x/32` (see [§1](#1-server-peer-allowedips-most-likely-cause)). Or use Admin → Devices → Sync peer for the device.
4. Set client `MTU = 1280` and retest.
5. Restart the container after changes.

**Subnet alignment:** If the AmneziaWG container uses a different tunnel subnet (e.g. `10.66.66.0/24` on `awg0`) than the default `10.8.1.0/24`, either configure the server in Admin with a profile that sets `subnet_address` / `amnezia_subnet` to match (e.g. `10.66.66.0`), or reconfigure the container to use `10.8.1.0/24`. NAT must cover the subnet actually used by the server interface.
