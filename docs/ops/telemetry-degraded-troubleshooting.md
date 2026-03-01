# Telemetry Degraded / Partial Data Troubleshooting

When the admin dashboard shows "Partial data · Source: Prometheus · Last successful: …" or "Prometheus/telemetry is degraded", follow these checks.

## 1. Verify Prometheus can reach admin-api

```bash
# From host (Prometheus port 19090)
curl -s 'http://127.0.0.1:19090/api/v1/query?query=up{job="admin-api"}' | jq '.data.result'

# Should return at least one result with value [ts, "1"]. Empty = admin-api not scraped.
```

## 2. Ensure admin-api and Prometheus share a network

Prometheus must be on `vpn-suite-app` to reach `admin-api:8000`. If degraded after restart, recreate Prometheus:

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile monitoring up -d prometheus --force-recreate
./manage.sh up-monitoring   # Or start full monitoring stack
```

## 3. Check TELEMETRY_PROMETHEUS_URL

In `.env`:

```
TELEMETRY_PROMETHEUS_URL=http://prometheus:9090
```

Use the Docker service name `prometheus`, not `127.0.0.1`.

## 4. Check NODE_DISCOVERY and server filter

With `NODE_DISCOVERY=docker`, servers are filtered by `docker_vpn_container_prefixes` (default: `amnezia-awg`). If the DB has no servers whose names start with that prefix, server_rows are empty and freshness can show degraded.

- Add at least one server with name matching the prefix, or
- Use `NODE_DISCOVERY=agent` when using node-agent.

## 5. Confirm admin-worker is running

The telemetry polling task (admin-worker) fills Redis timeseries. If it is not running, timeseries stays empty and the dashboard falls back to Prometheus only.

```bash
docker compose ps admin-worker
docker compose logs admin-worker --since 5m | grep -i telemetry
```

## 6. Redis timeseries

```bash
docker compose exec redis redis-cli ZRANGE dashboard:timeseries:cluster 0 -1
```

Non-empty output with `{"ts":...,"peers":...,"rx":...,"tx":...}` = telemetry polling is writing data.
