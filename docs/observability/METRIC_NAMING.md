# Metric Naming Conventions

Consistent naming for Prometheus metrics across VPN Suite.

## Prefixes

- `vpn_` — Control-plane (admin-api, worker). Example: vpn_revenue_mrr, vpn_peers_expected.
- `wireguard_` — wg-exporter (per-node). Example: wireguard_peers, wireguard_received_bytes.
- `bot_` — Telegram bot. Example: bot_commands_total, bot_retries_total.
- `node_agent_` — node-agent (optional).
- `miniapp_` — Mini App events (backend). Example: miniapp_events_total.

## Type Suffixes

- `_total` — Counter. Example: http_requests_total, funnel_events_total.
- `_seconds` — Duration (histogram or gauge). Example: http_request_duration_seconds.
- `_bytes` — Bytes. Example: wireguard_received_bytes.
- `_count` — Gauge count. Example: vpn_peers_ghost_count.

## Labels

- server_id, node_id — Server/node identifier.
- job, service_name — Prometheus job / relabel.
- env — Deployment (external_labels).
- path_template, status_class — HTTP.
- event_type, event — Funnel or miniapp event.
- severity — Alert or abuse severity.
