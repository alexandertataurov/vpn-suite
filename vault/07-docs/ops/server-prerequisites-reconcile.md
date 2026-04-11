# Server prerequisites and reconcile recovery

## Server prerequisites (AmneziaWG node)

Before issuing configs or expecting handshake/traffic, ensure the VPN server (e.g. amnezia-awg2 container) and host meet these requirements.

### 1. UDP port

- The AmneziaWG interface must **listen** on the configured port (e.g. `AWG_LISTEN_PORT=45790` in the container).
- The **host firewall** must allow **inbound UDP** on that port (e.g. `ufw allow 45790/udp` or equivalent iptables rule).
- Cloud/VM security groups or network ACLs must also allow UDP to the host on that port.

### 2. IP forwarding

- **IPv4:** `net.ipv4.ip_forward=1` on the host (and in the container if not inheriting).
- **IPv6 (if used):** `net.ipv6.conf.all.forwarding=1`.
- Check: `sysctl net.ipv4.ip_forward` (expect 1).

### 3. NAT / MASQUERADE

- Reply traffic from VPN clients must be NAT’d to the egress interface so it can reach the internet.
- The amnezia-awg2 **entrypoint** adds iptables rules when `AWG_NAT=1`: PostUp adds MASQUERADE for the tunnel subnet on `AWG_EGRESS_IFACE` (e.g. `eth0`), and FORWARD rules for the tunnel interface.
- If the container runs without these (e.g. host network or custom networking), ensure equivalent NAT and FORWARD rules exist on the host. See [amnezia-nat-setup.sh](../../infra/scripts/ops/amnezia-nat-setup.sh) for a host-level script.

### 4. Reply routes

- The control-plane (or node-agent) ensures **reply routes** for the client subnet (e.g. `10.8.1.0/24`) so that traffic destined to client IPs is sent via the WireGuard interface. This is done in `node_runtime_docker._ensure_client_subnet_routes` and by the container’s PostUp when using `AWG_TUNNEL_CLIENT_SUBNET`.

### 5. MTU

- Client config and server should agree on MTU (e.g. 1280 for mobile/full-tunnel, 1420 for desktop). Mismatch can cause fragmentation or dropped traffic. Set via server profile or `AWG_MTU` in the container.

**Quick checklist:** Port open → Forward=1 → NAT/MASQUERADE for tunnel subnet → Reply routes → MTU consistent. See [[07-docs/ops/no-traffic-troubleshooting|no-traffic-troubleshooting.md]] for deeper diagnostics.

---

## Reconcile recovery behaviour

The **admin-api** treats the **database as the source of truth** for which peers should exist on each node. The **reconciliation loop** (when `NODE_DISCOVERY=docker`) runs periodically (default every 60 seconds) and:

1. Loads from the DB all **devices** for each node (by `server_id`), excluding revoked/suspended.
2. Fetches the **actual** peer list from the node via `wg show` / `list_peers`.
3. Computes a **diff**: peers to add (in DB but missing on node), to remove (on node but not in DB), to update (allowed_ips/psk drift).
4. Applies the diff: **add** missing peers, **remove** unknown peers, **update** drifted peers (remove + add).
5. For any peer **re-added** during reconcile, the corresponding **Device** row is updated: `apply_status=APPLIED`, `last_applied_at=now`, `last_error` cleared.

**After a node/container restart:** Peers exist only in the node’s runtime (not in the config file). So after restart, the node has **no peers** until the next reconcile cycle. Within one cycle (e.g. 60 s), the control-plane reconciles and re-applies all peers from the DB. No manual action is required; handshake and traffic resume once the client reconnects.

**Metrics:** `vpn_peers_expected` (per node) = count from DB; `vpn_peers_present` (per node) = count from `wg show`. Alert **VpnPeersDrift** fires when `vpn_peers_expected - vpn_peers_present > 0` for 5 minutes.

**Agent mode:** When `NODE_DISCOVERY=agent`, the control-plane does **not** run the reconcile loop (node-agent owns desired state and applies peers). Recovery after node restart is handled by the node-agent when it next applies desired state from the API.
