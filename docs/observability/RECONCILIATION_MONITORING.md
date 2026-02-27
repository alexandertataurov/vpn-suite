# Peer State Reconciliation Monitoring

DB peer list vs node peer list; drift, ghost, and expired-active detection.

## Metrics

| Metric | Meaning |
|--------|--------|
| `vpn_peers_expected{node_id}` | Peers expected on node (from DB, active devices) |
| `vpn_peers_present{node_id}` | Peers present on node (from wg show / list_peers) |
| `vpn_peers_orphan_count{node_id}` | Peers on node not in DB (orphan/ghost); set when reconciliation_remove_orphans=false |
| `vpn_peers_ghost_count{node_id}` | Same as orphan: peers on node not in DB |
| `vpn_peers_expired_active_count{node_id}` | Peers on node that are revoked in DB but still present on wireguard |
| `vpn_reconciliation_drift{drift_type}` | Number of items requiring correction (e.g. missing, extra) |
| `vpn_reconciliation_runs_total{status}` | Reconciliation cycles success/failure |

## Logic

- **Reconcile loop:** `reconciliation_engine.reconcile_node()` loads DB peers (active devices for server), calls `adapter.list_peers(node_id)` for actual state, `compute_diff()` for to_add / to_remove / to_update.
- **Ghost/orphan:** `diff.peers_to_remove` = peers on node not in DB → `vpn_peers_ghost_count` and `vpn_peers_orphan_count`.
- **Expired but active:** Query DB for devices with `revoked_at IS NOT NULL` and `server_id` in scope; intersect public_key with wg_peers; count → `vpn_peers_expired_active_count`.

## Alerts

- **VpnPeersDrift:** `(vpn_peers_expected - vpn_peers_present) > 0` for 5m.
- **VpnPeersAllMissing:** `vpn_peers_present == 0 and vpn_peers_expected > 0` for 1m (critical).
- **VpnPeersGhost:** `vpn_peers_ghost_count > 0` for 5m (warning).
- **VpnPeersExpiredActive:** `vpn_peers_expired_active_count > 0` for 5m (warning).
