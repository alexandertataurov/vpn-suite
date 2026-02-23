# VPN Suite – Architecture

## Service layout and profiles

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                  docker-compose (vpn-suite)              │
                    │                  network: vpn-suite (bridge)            │
                    └─────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │ profile: core                        │                        profile: monitoring
        ▼                                     ▼                                        ▼
┌───────────────┐  PANEL_URL    ┌─────────────────────┐         ┌──────────────────────────────────┐
│ telegram-     │ ────────────► │ amnezia-panel-web   │         │ Prometheus, Grafana, Loki,         │
│ vpn-bot       │  (REST API)   │ (PHP 8, port 80)    │         │ Promtail, Alertmanager,            │
│ (Python, 8090)│               └──────────┬──────────┘         │ node-exporter, cAdvisor,           │
└───────────────┘                          │                     │ blackbox-exporter, VictoriaMetrics,│
                                           │ depends_on          │ grafana-renderer                  │
                                   ┌───────▼───────┐             └──────────────────────────────────┘
                                   │ amnezia-      │
                                   │ panel-db      │
                                   │ (MySQL 8,     │
                                   │  3306 internal)│
                                   └───────────────┘
        ┌───────────────┐
        │ amnezia-awg   │  (metaligh/amneziawg, UDP 47604→51820, NET_ADMIN, /dev/net/tun)
        │ (AmneziaWG)   │
        └───────────────┘
```

## Data flow

- **User → Bot**: Telegram → telegram-vpn-bot (mini-app on 8090, healthz on 8090).
- **Bot → Panel**: HTTP to `http://amnezia-panel-web` (REST API) for user/config operations.
- **Panel → DB**: MySQL to `amnezia-panel-db` (internal port 3306).
- **Panel ↔ Bot data**: Panel container mounts `telegram-vpn-bot/data` and `telegram-vpn-bot/.env` (suite paths) for integration.
- **Monitoring**: Prometheus scrapes targets by service name on `vpn-suite`; Promtail sends logs to Loki; Grafana uses Prometheus/Loki datasources.

## Control plane

- **systemd**: `vpn-suite.service` (oneshot, RemainAfterExit) runs compose from `/opt/vpn-suite` with both profiles.
- **CLI**: `manage.sh` — config, up/down by profile, ps, logs, cutover-stop-legacy, rollback-start-legacy. Use this as the only interface for ops; avoid ad-hoc docker compose for routine operations.

## Internal DNS

Containers on `vpn-suite` resolve service names (e.g. `amnezia-panel-web`, `amnezia-panel-db`) via Docker’s embedded DNS. Bot must use `PANEL_URL=http://amnezia-panel-web`, not `localhost` or host IP.

## Ports (host)

| Service / purpose      | Host port(s) |
|------------------------|--------------|
| Panel web              | 8082         |
| Panel DB                | 3307         |
| Bot mini-app / healthz  | 127.0.0.1:8090 |
| amnezia-awg             | 47604/udp    |
| Prometheus              | 127.0.0.1:9090 |
| Grafana                 | 127.0.0.1:3000 |
| Loki                    | 127.0.0.1:3100 |
| Alertmanager            | 127.0.0.1:9093 |
| node-exporter           | 127.0.0.1:9100 |
| blackbox-exporter       | 127.0.0.1:9115 |
| VictoriaMetrics         | 127.0.0.1:8428 |
| grafana-renderer        | 127.0.0.1:8085 |
| cAdvisor                | 127.0.0.1:8081 |
