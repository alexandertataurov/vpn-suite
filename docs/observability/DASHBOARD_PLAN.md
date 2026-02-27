# Dashboard Layout Plan

Ten Grafana dashboards for VPN Suite. Naming: `VPN Suite - <name>`. Tags: `vpn-suite`, `observability`.

| # | Dashboard | UID | Panels (summary) | Datasource |
|---|------------|-----|------------------|------------|
| 1 | Executive Overview | vpn-suite-executive | MRR, ARR, cluster health, error rate, conversion trend, revenue over time | Prometheus |
| 2 | Infrastructure Overview | vpn-suite-infra | Targets up/down, CPU % by instance, memory % by instance, up by job | Prometheus |
| 3 | Node Health | vpn-suite-node-health | Node health score, peers per node, handshake age, RX/TX rate by node | Prometheus |
| 4 | Provisioning Pipeline | vpn-suite-provisioning | Issue success rate, provision failures, issue latency P95, config download/gen | Prometheus |
| 5 | Payment Health | vpn-suite-payment | Webhook received/processed/failed, payment webhook rate by status | Prometheus |
| 6 | Conversion Funnel | vpn-suite-funnel | Conversion %, trial started, funnel events by stage, miniapp events | Prometheus |
| 7 | Churn Risk | vpn-suite-churn | Renewal rate, churn rate, expiring in 30d, renewal/churn over time | Prometheus |
| 8 | Abuse Monitoring | vpn-suite-abuse | Abuse high/medium risk users, anomaly high risk, config regen cap hits, abuse signals by severity, anomaly score max | Prometheus |
| 9 | Referral System Health | vpn-suite-referral | Referral signups/paid (30d), referral rate over time | Prometheus |
| 10 | Latency by Endpoint | vpn-suite-latency | API P95 latency, P50/P95/P99 by path, DB time per request P95, Redis latency | Prometheus |

## Drill-Down

- Panels can link to server detail dashboard (e.g. `server-detail.json`) with `server_id` / `node_id` in URL.
- Logs: use Loki with `trace_id` or `request_id` for correlation.
- Traces: use Tempo with trace_id from logs or metrics.

## Location

`config/monitoring/grafana/dashboards/*.json`. Provisioned via Grafana dashboard provisioning (see `config/monitoring/grafana/provisioning/dashboards/`).
