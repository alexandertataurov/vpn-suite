# Alert Rules Specification

Alert groups, rules, routing, and annotations.

## Alertmanager

- Config: config/monitoring/alertmanager.yml.
- Receivers: default (no-op), critical, warning. Configure Telegram/Slack/email in override or via env.
- Route tree: severity=critical to critical; severity=warning to warning. Group by alertname, job, server_id, node_id.
- Timing: group_wait 30s, group_interval 5m, repeat_interval 4h.
- Inhibit: AdminApiDown inhibits ScrapeTargetDown/PrometheusTargetDown for same job/instance.

## Rule Files

- config/monitoring/alert_rules.yml: main rules (vpn-suite, admin-operator, docker-telemetry, business, infrastructure-extra, application).
- ALERTS/unified-alerts.yml: unified-observability group.

## Groups and Rules (Summary)

- vpn-suite: ScrapeTargetDown, AdminApiDown, HighErrorRate, HighLatency, VpnNoSchedulableNodes, VpnNodeHealthLow, VpnReconciliationFailures, VpnPeersDrift, VpnPeersAllMissing, VpnDevicesNoHandshake, VpnPeersGhost, VpnPeersExpiredActive.
- admin-operator: AdminIssuanceFailuresRepeated, AuthFailuresSpike, PaymentWebhookFailureRate, ProvisionFailureSpike, ConfigDownloadFailureSpike.
- docker-telemetry: DockerContainerHighCPU/Memory, DockerContainerRestartLoop, NodeMemoryPressure, NodeSwapHeavy, DockerHostDiskPressure.
- business: RevenueDrop, PaymentFailureSpike, RenewalRateDrop.
- infrastructure-extra: HighNodeCpu5m, WireguardHandshakeStaleSpike, WgExporterNodeNotDiscovered.
- application: ProvisioningErrorRateHigh, DbLatencyHigh.
- unified-observability: PrometheusTargetDown, HighNodeCpu, HighNodeMemory, VpnHandshakeAgeHigh, VpnPeersDrop.

## Annotations

Alerts include summary and description with server_id, node_id, value. Add link to Grafana dashboard in receiver config.
