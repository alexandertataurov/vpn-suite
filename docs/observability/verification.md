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

---

## 6. Analytics gateway

```bash
# Requires auth token
curl -s -H "Authorization: Bearer <JWT>" http://localhost:8000/api/v1/analytics/telemetry/services | jq '.'
```

**Expected:** `{"services": [...], "prometheus_available": true}` or `"prometheus_available": false` with message when Prometheus unset.

---

## 7. Health

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/health/ready
curl -s http://localhost:8090/healthz
```

**Expected:** 200, JSON with `status: ok`.
