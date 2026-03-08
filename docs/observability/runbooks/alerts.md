# Alert Runbooks

Links and quick actions for observability alerts.

## AuthFailureSpike
**Severity:** warning  
**Dashboard:** [VPN Suite - Executive Overview](/grafana/d/vpn-suite-executive)  
**Action:** Check admin-api logs for auth failures; verify rate limit settings; review for brute-force patterns.

## ReferralAttachFailuresSpike
**Severity:** warning  
**Dashboard:** [VPN Suite - Referral Health](/grafana/d/vpn-suite-referral)  
**Action:** Check referral_attach_fail_total by reason; verify referrer lookup; check referral code format.

## PostgresExporterDown
**Severity:** warning  
**Dashboard:** [VPN Suite - Infrastructure](/grafana/d/vpn-suite-infra)  
**Action:** Verify postgres-exporter container; check postgres connectivity; inspect DATA_SOURCE_NAME.

## RedisExporterDown
**Severity:** warning  
**Dashboard:** [VPN Suite - Infrastructure](/grafana/d/vpn-suite-infra)  
**Action:** Verify redis-exporter container; check Redis connectivity; inspect REDIS_ADDR.

## PrometheusTargetDown
**Action:** Check target service; verify discovery; inspect Prometheus scrape targets.

## HighNodeCpu / HighNodeMemory
**Action:** Check container/host resource usage; consider scaling or tuning.
