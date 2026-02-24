# Observability Guide

Metrics, logs, tracing, and validation for VPN Suite.

---

## Quick reference

| Need | Doc / Command |
|------|---------------|
| Service inventory (ports, metrics, health) | [current-state.md](../observability/current-state.md) |
| Deploy/debug monitoring | [runbook-observability.md](../observability/runbook-observability.md) |
| Validate targets, queries | [validation.md](../observability/validation.md) |
| AWG data contract | [data-contract.md](../observability/data-contract.md) |

---

## Stack (monitoring profile)

```bash
./manage.sh up-monitoring
```

| Component | Port | Role |
|-----------|------|------|
| Prometheus | 127.0.0.1:19090 | Metrics (file_sd from discovery) |
| Grafana | 127.0.0.1:3000 | Dashboards |
| Loki | 127.0.0.1:3100 | Log aggregation |
| Promtail | 9080 | Docker logs → Loki |
| Tempo | 127.0.0.1:3200 | Traces |
| otel-collector | 127.0.0.1:4317 | OTLP ingest |
| discovery-runner | — | Targets → targets.json |
| wg-exporter | 9586 | WireGuard metrics |

---

## Dataflow

- **Metrics:** admin-api, bot, node-agent, cadvisor, node-exporter, wg-exporter → Prometheus
- **Logs:** Docker containers → Promtail → Loki
- **Traces:** admin-api OTEL → otel-collector → Tempo

→ Detail: [current-state.md](../observability/current-state.md#2-dataflow-diagram)

---

## Service-specific

| Service | Doc |
|---------|-----|
| admin-api | [services/admin-api.md](../observability/services/admin-api.md) |
| node-agent | [services/node-agent.md](../observability/services/node-agent.md) |
| telegram-vpn-bot | [services/telegram-vpn-bot.md](../observability/services/telegram-vpn-bot.md) |
| wg-exporter | [services/wg-exporter.md](../observability/services/wg-exporter.md) |
| amnezia-awg2 | [services/amnezia-awg2.md](../observability/services/amnezia-awg2.md) |

---

## Target architecture, gaps, plans

- [target-architecture.md](../observability/target-architecture.md)
- [gaps.md](../observability/gaps.md)
- [IMPLEMENTATION_PLAN.md](../observability/IMPLEMENTATION_PLAN.md)
