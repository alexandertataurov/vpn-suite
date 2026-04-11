# AmneziaWG Runtime Integration

This document reflects the current control-plane model:

- Execution nodes are AmneziaWG containers (`amnezia-awg*`).
- **NODE_MODE=real** (single-host/dev): control-plane uses Docker runtime (`docker exec ... wg ...`).
- **NODE_MODE=agent** (production): node-agent applies desired state via Docker on each node; control-plane stores state in DB.
- No HTTP management API is required or used inside AWG containers.

## Capability Matrix

| Capability | Supported | Runtime method | Admin API surface |
|------------|-----------|----------------|-------------------|
| Node discovery | Yes | `docker ps --format '{{.Names}}'` filtered by `amnezia-awg*` | `POST /api/v1/cluster/scan` |
| Node topology | Yes | `docker exec <node> wg show <iface> dump`, `ip -j addr show <iface>` | `GET /api/v1/cluster/topology` |
| Node health | Yes | command latency + handshake-derived health score | `GET /api/v1/cluster/health` |
| Peer list | Yes | `docker exec <node> wg show <iface> dump` | `GET /api/v1/wg/peers` |
| Peer provision | Yes | `docker exec <node> wg set <iface> peer ...` | `POST /api/v1/wg/peer` |
| Peer remove | Yes | `docker exec <node> wg set <iface> peer <pubkey> remove` | `DELETE /api/v1/wg/peer/{pubkey}` |
| Drift reconciliation | Yes | compare runtime peers vs DB, idempotent repair | `POST /api/v1/cluster/resync` |
| Cluster metrics | Yes | control-plane emits Prometheus metrics | `/metrics` |

## Runtime Flow

1. Discover containers with prefix `amnezia-awg`.
2. Detect working WireGuard interface (`awg0`/`wg0` fallback + `wg show interfaces` probe).
3. Build topology map (node id, interface, peer count, port, health, latency).
4. Schedule new peers on best node (capacity/health/load weighted score).
5. Reconcile runtime and DB state in background loop.

## Security Controls

- Shell arguments are sanitized (`container_name`, `interface`, `public_key`, `allowed_ips`).
- Runtime commands execute with bounded timeouts.
- Private keys are never logged.
- Docker socket is mounted read-only for `admin-api`.

## Obfuscation runbook (production)

- **S1, S2, H1–H4** must match the server in every issued client config; otherwise handshake or traffic can fail or be detectable by DPI.
- **User-issued configs** (bot/WebApp) get obfuscation from the node when a runtime adapter is available: `issue_service.issue_device` calls `get_obfuscation_from_node(resolved_server_id)` and merges over ServerProfile defaults, same as admin-issued configs.
- **Server [Interface] obfuscation**: The amnezia-awg2 entrypoint supports optional env vars (`AWG_Jc`, `AWG_Jmin`, `AWG_Jmax`, `AWG_S1`, `AWG_S2`, `AWG_H1`–`AWG_H4`) that are written into the server config; when set, they must match issued client configs. See [[07-docs/ops/amneziawg-obfuscation-runbook|amneziawg-obfuscation-runbook.md]].
- Verify on each node / after image change: `docker exec <container> wg show <iface>` and confirm Jc, Jmin, Jmax, S1, S2, H1–H4 in output. Ensure ServerProfile `request_params` or runtime sync (`get_obfuscation_from_node`) use the same S1, S2, H1–H4.
- Use AmneziaWG (profile_type=awg) as default in production, not plain WG. Prefer per-server or per-region obfuscation in ServerProfile. See `apps/admin-api/app/services/node_runtime_docker.py` and `apps/admin-api/app/core/amnezia_config.py`.
