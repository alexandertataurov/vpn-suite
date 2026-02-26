# Unified Observability Validation

## Targets Green (10 minutes)
- `curl -s http://127.0.0.1:19090/api/v1/targets`
- Confirm all targets are `up` for at least 10 minutes.

## Example Queries
- `up{job="admin-api"} == 1`
- `up{job="cadvisor"} == 1`
- `up{job="node-exporter"} == 1`
- `up{job="node-agent"} == 1` (when agent running)
- CPU per node:
  - `rate(node_cpu_seconds_total{mode!="idle"}[5m])`
- Container restarts (cadvisor, best-effort):
  - `changes(container_start_time_seconds[30m])`
- VPN traffic:
  - `vpn_node_traffic_rx_bytes`
  - `vpn_node_traffic_tx_bytes`
