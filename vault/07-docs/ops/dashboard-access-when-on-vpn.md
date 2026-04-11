# Dashboard access when connected to VPN

**Conclusion:** The codebase does **not** block or restrict dashboard access when the user is connected to the VPN. By design, the admin dashboard at `https://{$PUBLIC_DOMAIN}/admin` and API at `/api/*` are reachable from any source, including VPN tunnel clients (`10.8.1.0/24` or `10.66.66.0/24`).

---

## 1. Codebase findings

| Area | Finding |
|------|--------|
| **Caddy** | `{$PUBLIC_DOMAIN}` block (ports 80/443) has **no** `remote_ip` or source filter. Only `:8443` (agent) uses `AGENT_ALLOW_CIDRS`. |
| **Client config** | Full tunnel by default: `AllowedIPs = 0.0.0.0/0, ::/0` ([connection_stability.md](connection_stability.md)). All traffic, including to PUBLIC_DOMAIN, goes through the VPN. |
| **Split tunnel** | No feature to exclude the dashboard domain or control-plane IP from the tunnel. |
| **Firewall** | UFW/docs allow 80, 443, 8443; no rule that drops traffic from tunnel subnet to 80/443. |

So when a connected client opens `https://PUBLIC_DOMAIN/admin`, that traffic goes over the VPN and is accepted by Caddy like any other client.

---

## 2. Traffic flow

### Same host (control plane + VPN node on one machine)

1. Client (tunnel IP e.g. `10.8.1.2`) requests `https://PUBLIC_DOMAIN/admin`.
2. Packet goes: client → VPN tunnel → host. Host receives packet (dst = its public IP, src = 10.8.1.2).
3. Caddy listens on `0.0.0.0:443`; request is served.
4. Reply: host → route `10.8.1.0/24 dev awg0` → tunnel → client.

No NAT is required for this path; the host is the final destination.

### Multi-host (control plane A, VPN node B)

1. Client connects to VPN on B. Client requests `https://PUBLIC_DOMAIN` (host A).
2. Packet: client → tunnel to B → B NATs (MASQUERADE) → internet → A.
3. A serves the request (source seen as B’s public IP).
4. Reply: A → B → conntrack DNAT → tunnel → client.

Normal NAT and reply routing apply; no special “dashboard block” is involved.

---

## 3. When dashboard might be unreachable (edge cases)

- **Hairpin / NAT reflection:** If the dashboard is behind a load balancer or router that does not support hairpin NAT, and the client reaches the **same** host via the VPN using its **public** hostname, some setups can fail. Fix: use internal hostname or split-tunnel (not implemented in suite) for admin.
- **Host firewall:** If you add a rule that drops or rejects INPUT from `10.8.1.0/24` or `10.66.66.0/24` to ports 80/443, VPN clients will lose dashboard access. Default UFW in docs does not do this.
- **AGENT_ALLOW_CIDRS:** Only affects `:8443` (agent API). Unset or `0.0.0.0/0 ::/0` allows all; if restricted, it does not change 80/443 dashboard access.

---

## 4. How to verify

1. **Connect a client** with an issued config (full tunnel).
2. **From that client:** open `https://{$PUBLIC_DOMAIN}/admin` and log in; confirm dashboard and API calls work.
3. **On server (same-host):** ensure no iptables/UFW rule blocks INPUT from tunnel subnet to 80/443:
   - `sudo iptables -L INPUT -n -v`
   - `sudo ufw status`
4. **Optional:** From connected client: `curl -sI https://{$PUBLIC_DOMAIN}/admin` → expect HTTP 200 or 302 to login.

If dashboard fails only when VPN is on, check: host firewall, cloud security groups for 80/443, and (in multi-host) NAT/conntrack on the VPN node.
