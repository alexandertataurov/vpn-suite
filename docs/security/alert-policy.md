# Alert Policy

Thresholds, severities, and runbook links. Rules: `infra/monitoring/config/alert_rules.yml`.

---

## Implemented Alerts (by group)

### vpn-suite

| Alert | Threshold | Severity | Runbook |
|-------|-----------|----------|---------|
| AdminApiDown | up == 0 | critical | [incident-response](incident-response-runbook.md) |
| HighErrorRate | 5xx rate >5% | warning | [ops runbook](../ops/runbook.md) |
| ServersAPIHigh5xxRate | >1% | warning | Check admin-api logs |
| OverviewOperatorHigh5xxRate | >0.5% | warning | Operator dashboard |
| OverviewOperatorPrometheusDegraded | query failures ≥5 in 5m | warning | Telemetry degraded |
| HighLatency | p95 >2s | warning | Scale / investigate |
| VpnNoSchedulableNodes | none healthy/degraded | critical | Control-plane down |
| VpnNodeHealthLow | <0.5 | warning | Node degraded |
| VpnNodeUnhealthy | any unhealthy | warning | Node down |
| VpnClusterLoadHigh | >0.85 | warning | Scale nodes |
| VpnReconciliationFailures | any failure in 10m | critical | Agent connectivity |
| VpnReconciliationStalled | no success in 15m | warning | Control-plane stalled |
| VpnServerOffline | heartbeat >5m stale | warning | Agent unreachable |
| VpnHandshakeFreshnessCollapse | max age >1h | warning | Peers may appear offline |

### admin-operator

| Alert | Threshold | Severity |
|-------|-----------|----------|
| AdminIssuanceFailuresRepeated | ≥3 in 10m | warning |
| AdminIssuanceFailureRateHigh | >50% | warning |
| ConfigDownloadFailureSpike | rate >0.1/s | warning |
| AuthFailuresSpike | rate >0.5/s | warning |
| PaymentWebhookFailureRate | >20% | warning |
| ProvisionFailureSpike | rate >0.5/s | warning |

### docker-telemetry

| Alert | Threshold | Severity |
|-------|-----------|----------|
| DockerContainerHighCPUWarning | >85% | warning |
| DockerContainerHighCPUCritical | >95% | critical |
| DockerContainerHighMemoryWarning | >90% | warning |
| DockerContainerHighMemoryCritical | >97% | critical |
| DockerContainerRestartLoop | >3 restarts in 5m | critical |
| DockerContainerUnhealthy | health == 0 | critical |
| NodeMemoryPressure | >90% used | warning |
| NodeSwapHeavy | >50%, >1GB | warning |
| DockerHostDiskPressure | <15% free | warning |

---

## Channels

| Severity | Channel | SLA |
|----------|---------|-----|
| critical | Pager / SMS | 15 min |
| warning | Slack / Email | 1 hour |

Configure Alertmanager to route labels to channels.

---

## Runbooks

- [incident-response-runbook.md](incident-response-runbook.md) — Compromise, key rotation, server lag
- [../ops/runbook.md](../ops/runbook.md) — Ops procedures
