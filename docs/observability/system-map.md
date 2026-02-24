# VPN Suite — Runtime System Map

Source of truth for observability coverage. Criticality: **P0** = must never fail; **P1** = high impact; **P2** = supporting.

| Component | Responsibility | Inbound / Outbound | Tier | Telemetry (current) | Data stores / APIs |
|-----------|----------------|--------------------|------|---------------------|--------------------|
| **admin-api** | Control-plane API, auth, servers/peers/devices, cluster, agent, telemetry, background loops | In: Caddy, bot, frontend, agent. Out: Postgres, Redis, Docker, optional Prometheus | P0 | Logs: JSON + request_id. Metrics: /metrics. Health: /health, /health/ready. No trace_id. | Postgres, Redis, Docker API, Prometheus (opt) |
| **reverse-proxy** | Caddy: TLS, static admin/webapp, proxy to admin-api, agent mTLS 8443 | In: public. Out: admin-api, agent | P0 | None (Caddy default logs). Health: /health → admin-api | — |
| **postgres** | Primary DB | In: admin-api | P0 | Container healthcheck only | — |
| **redis** | Cache, rate limit, bot FSM, agent heartbeat | In: admin-api, bot | P0 | Container healthcheck only | — |
| **telegram-vpn-bot** | Telegram bot + WebApp; calls admin-api | In: Telegram. Out: admin-api (PANEL_URL) | P1 | Logs: structlog JSON. No metrics. Health: /healthz | Redis (optional FSM) |
| **node-agent** | Data-plane: desired state, reconcile, heartbeat | In: —. Out: admin-api (heartbeat, desired-state, actions) | P1 | Logs: minimal. Metrics: /metrics (9105). Health: /healthz. Not scraped in default prometheus.yml | Docker socket |
| **prometheus** | Scrape metrics | In: —. Out: admin-api, cadvisor, node-exporter | P2 | — | — |
| **loki / promtail** | Log aggregation | Promtail → Loki | P2 | — | — |
| **grafana** | Dashboards | In: ops | P2 | — | — |

## Criticality summary

- **P0:** admin-api, reverse-proxy, postgres, redis
- **P1:** telegram-vpn-bot, node-agent
- **P2:** prometheus, loki, promtail, grafana

## Start commands

- Core: `./manage.sh up-core` (postgres, redis, admin-api, reverse-proxy, telegram-vpn-bot)
- Monitoring: `./manage.sh up-monitoring` (prometheus, cadvisor, node-exporter, loki, promtail, grafana)
- Agent: `./manage.sh up-agent` (node-agent; profile agent)
