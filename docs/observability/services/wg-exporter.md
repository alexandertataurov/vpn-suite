# wg-exporter — Observability

**Service:** WireGuard/AmneziaWG metrics exporter  
**Path:** [`monitoring/wg-exporter/`](../../monitoring/wg-exporter)  
**Port:** 9586  

## Metrics

| Endpoint | Format | Source |
|----------|--------|--------|
| `GET /metrics` | Prometheus | [`wg_exporter.py`](../../monitoring/wg-exporter/wg_exporter.py) L104 |

**Data source:** `docker exec <WG_CONTAINER> wg show <WG_INTERFACE> dump`.

### Currently exported

| Metric | Type | Labels |
|--------|------|--------|
| `wireguard_up` | gauge | — |
| `wireguard_peers` | gauge | — |
| `wireguard_listen_port` | gauge | — |
| `wireguard_received_bytes` | counter | `peer` |
| `wireguard_sent_bytes` | counter | `peer` |
| `wireguard_latest_handshake_seconds` | gauge | `peer` |

### Available from dump but not exported

`endpoint`, `allowed_ips`, `persistent_keepalive`, `fwmark` — see [amnezia-awg2.md](./amnezia-awg2.md).

## Labels to add

`instance`, `node_id`, `server_id` (from env) for control-plane correlation.
