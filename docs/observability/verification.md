# Observability — Verification Commands

Runnable commands and expected outputs for validating the pipeline.

---

## 1. Compose

```bash
cd /opt/vpn-suite

# Core
./manage.sh up-core
./manage.sh ps

# Monitoring (includes discovery-runner, wg-exporter, tempo, otel-collector)
./manage.sh up-monitoring
./manage.sh ps
```

**Expected:** All services `running`. Prometheus, Loki, Grafana, discovery-runner, wg-exporter, tempo, otel-collector up.

---

## 2. Metrics endpoints

```bash
# Admin API
curl -s http://localhost:8000/metrics | head -30

# Bot
curl -s http://localhost:8090/metrics | head -20

# Prometheus targets
curl -s http://localhost:19090/api/v1/targets | jq '.data.activeTargets | length'
```

**Expected:** Prometheus-style output; `up` metric; `bot_requests_total` or similar.

---

## 3. Prometheus queries

```bash
# From host (Prometheus on 19090)
curl -sG 'http://localhost:19090/api/v1/query' --data-urlencode 'query=up' | jq '.data.result | length'

curl -sG 'http://localhost:19090/api/v1/query' --data-urlencode 'query=rate(http_requests_total[5m])' | jq '.data.result[0:3]'
```

**Expected:** Non-empty result array.

---

## 4. Loki (logs)

```bash
curl -sG 'http://localhost:3100/loki/api/v1/query_range' \
  --data-urlencode 'query={job="docker-containers"}' \
  --data-urlencode 'limit=5' | jq '.data.result | length'
```

**Expected:** 0 or positive (depends on Promtail scraping).

---

## 5. Tempo (traces)

```bash
curl -s http://localhost:3200/ready
```

**Expected:** 200.

Generate a few requests (to produce spans), then confirm Tempo ingestion counters increase:

```bash
curl -s http://localhost:8000/health >/dev/null
curl -s http://localhost:8000/api/v1/overview/health-snapshot >/dev/null || true
curl -s http://localhost:8090/healthz >/dev/null
curl -s http://localhost:3200/metrics | rg -n 'tempo_distributor_spans_received_total|tempo_ingester_traces_created_total'
```

**Expected:** `tempo_distributor_spans_received_total{tenant="single-tenant"} > 0` and `tempo_ingester_traces_created_total > 0`.

If the counters are zero, ensure `OTEL_TRACES_ENDPOINT=otel-collector:4317` is set for admin-api and bot (monitoring profile).

Optional: confirm search returns recent traces:

```bash
curl -s 'http://localhost:3200/api/search?limit=5' | jq '.traces[0:3]'
```

**Expected:** `rootServiceName` and `rootTraceName` populated for recent requests.

---

## 6. Analytics gateway

```bash
# Requires auth token
curl -s -H "Authorization: Bearer <JWT>" http://localhost:8000/api/v1/analytics/telemetry/services | jq '.'
curl -s -H "Authorization: Bearer <JWT>" http://localhost:8000/api/v1/analytics/metrics/kpis | jq '.'
```

**Expected:** Telemetry services: `{"services": [...], "prometheus_available": true}` or `"prometheus_available": false` when Prometheus unset. KPIs: `{"request_rate_5m": <float|null>, "error_rate_5m": <float|null>, "latency_p95_seconds": <float|null>}`; nulls when Prometheus unavailable.

---

## 7. Health

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/health/ready
curl -s http://localhost:8090/healthz
```

**Expected:** 200, JSON with `status: ok`.

---

## 8. Alertmanager (optional)

```bash
curl -s http://localhost:19093/-/ready
```

**Expected:** 200. Default config uses a no-op receiver; configure `config/monitoring/alertmanager.yml` for notifications.
