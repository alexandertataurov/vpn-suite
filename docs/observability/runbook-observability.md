# Unified Observability Runbook

## Deploy
1. Build and start monitoring stack:
   - `docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile monitoring up -d discovery-runner prometheus grafana cadvisor node-exporter loki promtail`
2. Verify Prometheus:
   - `curl -s http://127.0.0.1:19090/-/ready`
3. Verify Grafana:
   - `curl -s http://127.0.0.1:3000/api/health`

## Debug
- Prometheus targets:
  - `curl -s http://127.0.0.1:19090/api/v1/targets | rg -n "node-agent|admin-api"`
- Discovery runner:
  - `docker logs --tail=200 vpn-suite-discovery-runner-1`
  - `cat config/monitoring/discovery/mapping.json`

## Rollback
1. Stop new services:
   - `docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile monitoring stop discovery-runner`
2. Restore previous Prometheus config if needed:
   - Revert `config/monitoring/prometheus.yml` and restart Prometheus.

## Security
- Do not expose Prometheus or Grafana publicly without auth.
