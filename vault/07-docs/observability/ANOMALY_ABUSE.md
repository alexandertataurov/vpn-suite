# Anomaly and Abuse Detection

Automated risk scoring and Prometheus export.

## Abuse Detection

- Service: app.services.abuse_detection_service.run_abuse_detection(session).
- Runs: Every 15 min via admin_control_center_task._run_abuse_loop().
- Logic: Per-user features (excess_devices, shared_config, failed_payments, etc.), robust z-scores, composite score 0-1. Persists AbuseSignal for score > 0. Returns high_risk, medium_risk, signals_by_severity.
- Prometheus: vpn_abuse_high_risk_users, vpn_abuse_medium_risk_users (gauges); vpn_abuse_signals_total by severity (counter).

## Anomaly Detection (Control-Plane)

- Service: app.services.control_plane_service.anomaly_metrics(db, topo, runtime_adapter).
- Runs: Every 15 min via anomaly_metrics_task.run_anomaly_metrics_export_loop(adapter_factory) in the worker.
- Logic: Per-user features (active_devices, region_spread, reconnect_bursts, etc.), robust z-scores, score 0-1. Writes ControlPlaneEvent security.anomaly.scored.
- Prometheus: vpn_anomaly_high_risk_users, vpn_anomaly_score_max (gauges).

## Config Regeneration Abuse

- Cap: config_regen_daily_cap. When user hits cap, vpn_config_regen_cap_hits_total is incremented.
- Alert: Use rate or increase of vpn_config_regen_cap_hits_total for spike detection.

## Referral Fraud

Abuse signals can be extended for referral patterns. Exposed via same abuse gauges/counters.
