# Unified Observability Runbook

## Deploy

1. From repo root, start monitoring stack:
   - `./manage.sh up-monitoring`
   - Or: `docker compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.observability.yml --profile monitoring up -d discovery-runner prometheus grafana cadvisor node-exporter loki promtail tempo otel-collector`
2. Set `TELEMETRY_PROMETHEUS_URL=http://prometheus:9090` (or host URL) in `.env` so admin-api can query Prometheus for analytics and operator dashboard.
3. Optional tracing: set `OTEL_TRACES_ENDPOINT=otel-collector:4317` (manage.sh `up-monitoring` will set this for the monitoring session if it is unset).
4. Verify Prometheus: `curl -s http://127.0.0.1:19090/-/ready`
5. Verify Grafana: `curl -s http://127.0.0.1:3000/api/health`
6. Verify Tempo: `curl -s http://127.0.0.1:3200/ready`
7. OTEL Collector: receives OTLP on 4317 (gRPC) / 4318 (HTTP); no HTTP ready endpoint — check container logs if traces are missing.
8. Trace validation (optional): generate a few requests and confirm Tempo counters increase (see [[07-docs/observability/verification|verification.md]] §5).
9. Alerting: Alertmanager is running, but `infra/monitoring/config/alertmanager.yml` uses a no-op receiver by default. Configure a receiver (Slack/Email/PagerDuty) before relying on notifications.

## Debug

- Prometheus targets: `curl -s http://127.0.0.1:19090/api/v1/targets | rg -n "node-agent|admin-api"`
- Discovery runner: `docker logs --tail=200 vpn-suite-discovery-runner-1`, `cat infra/monitoring/config/discovery/targets.json`
- If analytics/operator show "metrics unavailable": ensure `TELEMETRY_PROMETHEUS_URL` is set and Prometheus is reachable from admin-api.

## Rollback
1. Stop new services:
   - `docker compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.observability.yml --profile monitoring stop discovery-runner`
2. Restore previous Prometheus config if needed:
   - Revert `infra/monitoring/config/prometheus.yml` and restart Prometheus.

## Security
- Do not expose Prometheus or Grafana publicly without auth.
