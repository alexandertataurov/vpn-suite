# Unified Observability Validation

## Targets Green (10 minutes)
- `curl -s http://127.0.0.1:19090/api/v1/targets`
- Confirm all targets are `up` for at least 10 minutes.

## Example Queries
- `up{job="admin-api"} == 1`
- `up{job="cadvisor"} == 1`
- `up{job="node-exporter"} == 1`
- `up{job="node-agent"} == 1` (when agent running)
- `up{job="outline-ss"} == 1` (when outline-ss-proxy running)
- `up{job="outline-poller"} == 1` (when outline-poller running)
- CPU per node:
  - `rate(node_cpu_seconds_total{mode!="idle"}[5m])`
- Container restarts (cadvisor, best-effort):
  - `changes(container_start_time_seconds[30m])`
- VPN traffic:
  - `vpn_node_traffic_rx_bytes`
  - `vpn_node_traffic_tx_bytes`
- Outline key count:
  - `outline_access_keys_total`
- Outline traffic per key:
  - `sum by (access_key) (rate(shadowsocks_data_bytes[5m]))`
  - Proxy check: `curl -s http://127.0.0.1:19092/metrics | rg -n "shadowsocks_data_bytes"`

## Drift Test
1. Create a new Outline access key via existing API:
   - `POST /api/v1/outline/keys`
2. Wait for poller interval (30s).
3. Verify:
   - `outline_access_keys_total` increases.
   - `outline_access_keys_created_total` increments.

## Mapping Check
- `cat config/monitoring/discovery/mapping.json`
- Ensure Outline hostname is linked to a matching AWG server when applicable.
