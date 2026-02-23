# Unified Observability Runbook

## Deploy
1. Build and start monitoring stack:
   - `docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile monitoring up -d discovery-runner prometheus grafana cadvisor node-exporter loki promtail outline-poller outline-ss-proxy`
2. Verify Prometheus:
   - `curl -s http://127.0.0.1:19090/-/ready`
3. Verify Grafana:
   - `curl -s http://127.0.0.1:3000/api/health`

## Debug
- Prometheus targets:
  - `curl -s http://127.0.0.1:19090/api/v1/targets | rg -n "outline|node-agent|admin-api"`
- Outline metrics:
  - `curl -s http://127.0.0.1:9092/metrics | rg -n "shadowsocks_data_bytes"`
  - From Prometheus (via proxy): `curl -s http://127.0.0.1:19092/metrics | rg -n "shadowsocks_data_bytes"`
- Outline poller:
  - `docker logs --tail=200 vpn-suite-outline-poller-1`
- Discovery runner:
  - `docker logs --tail=200 vpn-suite-discovery-runner-1`
  - `cat config/monitoring/discovery/mapping.json`

## Rollback
1. Stop new services:
   - `docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile monitoring stop discovery-runner outline-poller`
2. Restore previous Prometheus config if needed:
   - Revert `config/monitoring/prometheus.yml` and restart Prometheus.

## Security
- `OUTLINE_MANAGER_URL` stays internal and must not be exposed to public networks.
- Do not expose Prometheus or Grafana publicly without auth.
