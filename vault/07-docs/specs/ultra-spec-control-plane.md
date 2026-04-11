# Control-plane alignment (ULTRA SPEC)

This document maps the commercial VPN control-plane behaviour to the codebase. Reference: **ULTRA SPEC V3** (AmneziaWG, WireGuard runtime, control-plane vs data plane).

## Architecture

- **Telegram Bot** = Sales gateway (onboarding, plans, payments, config delivery). Communicates only with Admin API.
- **Admin API** = Control plane (orchestration, topology, reconciliation, provisioning).
- **AmneziaWG** = Execution nodes (Docker containers controlled via `wg`/`wg-quick` runtime commands).
- **Postgres** = Source of truth; **Redis** = state/cache; **Prometheus** = observability.

## Admin API control-plane endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/cluster/topology` | Current cluster topology (cached). |
| GET | `/api/v1/cluster/nodes` | List nodes (from topology). |
| GET | `/api/v1/cluster/health` | Aggregate cluster health (from topology). |
| POST | `/api/v1/wg/peer` | Provision peer (issue device); body: `user_id`, `subscription_id`, optional `server_id`, `device_name`. |
| DELETE | `/api/v1/wg/peer/{pubkey}` | Remove peer by public key (revoke device + remove from node). |
| POST | `/api/v1/cluster/resync` | Trigger reconciliation once (optional `node_id` in body). |
| POST | `/api/v1/cluster/nodes/{node_id}/drain` | Mark node draining (no new peers). |
| POST | `/api/v1/cluster/nodes/{node_id}/undrain` | Clear draining. |

Issue without `server_id`: use `POST /api/v1/users/{user_id}/devices/issue` or `POST /api/v1/wg/peer` with `server_id` omitted; load balancer selects node from topology.

## Node reachability

- **Recommended (production):** node-agent runs on each VPN node (data-plane host), discovers local awg container, reads runtime state (`awg show <iface> dump`), reconciles peers, and pushes heartbeat + pulls desired state from control-plane over **mTLS**.
- Control-plane does not require docker socket access and does not execute `docker exec` on remote nodes.

## Node mode

- **Agent** (`NODE_DISCOVERY=agent`, `NODE_MODE=agent`) is the supported production execution mode.
- **Docker** (`NODE_DISCOVERY=docker`, `NODE_MODE=real`) is supported only for single-host/dev; it requires mounting the Docker socket into control-plane and running `docker exec ... wg ...`.

## High availability

- **Discovery/exec failure**: Docker adapter reports failed nodes as `status=unhealthy`, `health_score=0`; load balancer excludes them.
- **Drain**: Use `POST /cluster/nodes/{node_id}/drain` to stop new peer assignment; `undrain` to resume.
- **Resync**: `POST /cluster/resync` runs reconciliation (DB vs node runtime); repairs drift (add/remove/update peers).
- **Metrics**: `vpn_nodes_total`, `vpn_node_health`, `vpn_peers_total`, `vpn_cluster_load_index`, `vpn_cluster_health_score`, `funnel_events_total`, `bot_conversion_rate` (see Prometheus/Grafana).

## References

- AmneziaWG: https://docs.amnezia.org/documentation/amnezia-wg/
- WireGuard: https://www.wireguard.com/ , `wg`(8) / `wg-quick`(8)
- Conventions and security: [reference.md](../.cursor/skills/vpn-suite/reference.md)
