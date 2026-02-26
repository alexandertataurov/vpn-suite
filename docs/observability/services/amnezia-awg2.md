# amnezia-awg2 — Observability

**Service:** VPN data-plane (AmneziaWG)  
**Path:** External repo at `/opt/amnezia/amnezia-awg2`  

## Metrics

No native `/metrics`. Metrics come from **wg-exporter** on the host. See `[wg-exporter.md](./wg-exporter.md)`.

wg-exporter runs `docker exec <WG_CONTAINER> wg show <WG_INTERFACE> dump` inside the container. AmneziaWG exposes the same WireGuard netlink dump format.

### Data source: `wg show dump` format

**Interface line (tab-separated):** `private_key`, `public_key`, `listen_port`, `fwmark`  
**Peer lines (per peer):** `public_key`, `preshared_key`, `endpoint`, `allowed_ips`, `latest_handshake`, `transfer_rx`, `transfer_tx`, `persistent_keepalive`

### Currently exported (wg-exporter)

| Metric | Type | Labels | Source field |
|--------|------|--------|--------------|
| `wireguard_up` | gauge | — | dump success |
| `wireguard_peers` | gauge | — | peer count |
| `wireguard_listen_port` | gauge | — | interface listen_port |
| `wireguard_received_bytes` | counter | `peer` | transfer_rx |
| `wireguard_sent_bytes` | counter | `peer` | transfer_tx |
| `wireguard_latest_handshake_seconds` | gauge | `peer` | now − latest_handshake |

### Possibly available (not yet exported)

| Source field | Example | Notes |
|--------------|---------|-------|
| `endpoint` | `203.0.113.42:54321` | Peer public IP:port. PII; use only if policy allows. GeoIP can derive country/city. |
| `allowed_ips` | `10.8.1.2/32` | Peer tunnel CIDR(s). Low cardinality; safe as label. |
| `persistent_keepalive` | `25` | Seconds. Could add `wireguard_peer_keepalive_seconds{peer}` gauge. |
| `fwmark` | `0` or `0x1234` | Interface fwmark. Could add `wireguard_fwmark` gauge. |

### Not suitable for metrics

| Field | Reason |
|-------|--------|
| `private_key` | Secret; never expose |
| `preshared_key` | Secret; never expose |
| `public_key` | Used as `peer` label; raw value in HELP only if needed |

### Limitation: rx/tx counter reset

`transfer_rx` / `transfer_tx` reset to 0 on interface/container restart. Use `rate()` / `increase()` for continuous metrics; see [target-architecture.md](../target-architecture.md) §8.

## Health

Docker healthcheck: `awg show ${AWG_INTERFACE:-awg0}` (`/opt/amnezia/amnezia-awg2/docker-compose.yml` L44–49).

## Logs

Docker json-file, 10m×3 files (`/opt/amnezia/amnezia-awg2/docker-compose.yml` L52–56). Promtail can scrape if on same host.

## Deployment

- wg-exporter runs on each VPN node host.
- Prometheus scrapes `host.docker.internal:9586` (same host) or node IP (multi-host).
- **Multi-host:** Set `DISCOVERY_REMOTE_WG_EXPORTERS` (JSON array) for remote wg-exporter targets: `[{"host":"10.0.0.5","port":9586,"node_id":"vpn-1","server_id":"srv-1"}]` (Prometheus relabels `node_id`/`server_id` onto scraped series).
- **Env (wg-exporter):** `WG_CONTAINER` must match the container name. amnezia-awg2 compose uses `container_name: amnezia-awg` — set `WG_CONTAINER=amnezia-awg`. `WG_INTERFACE` defaults to `awg0` (matches `AWG_INTERFACE` in compose).
