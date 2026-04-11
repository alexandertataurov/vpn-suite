# Observability Guide

Metrics, logs, tracing, and validation for VPN Suite.

---

## Quick reference

| Need | Doc / Command |
|------|---------------|
| Service inventory (ports, metrics, health) | [[07-docs/observability/current-state|current-state.md]] |
| Deploy/debug monitoring | [[07-docs/observability/runbook-observability|runbook-observability.md]] |
| Validate targets, queries | [[07-docs/observability/validation|validation.md]] |
| AWG data contract | [[07-docs/observability/data-contract|data-contract.md]] |

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

→ Detail: [[07-docs/observability/current-state#2-dataflow-diagram|current-state.md]]

---

## Service-specific

| Service | Doc |
|---------|-----|
| admin-api | [[07-docs/observability/services/admin-api|services/admin-api.md]] |
| node-agent | [[07-docs/observability/services/node-agent|services/node-agent.md]] |
| telegram-vpn-bot | [[07-docs/observability/services/telegram-vpn-bot|services/telegram-vpn-bot.md]] |
| wg-exporter | [[07-docs/observability/services/wg-exporter|services/wg-exporter.md]] |
| amnezia-awg2 | [[07-docs/observability/services/amnezia-awg2|services/amnezia-awg2.md]] |

---

## Target architecture, gaps, plans

- [[07-docs/observability/target-architecture|target-architecture.md]]
- [[07-docs/observability/gaps|gaps.md]]
- [[07-docs/observability/IMPLEMENTATION_PLAN|IMPLEMENTATION_PLAN.md]]
