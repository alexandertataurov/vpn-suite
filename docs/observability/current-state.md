# Observability — Current-State Map

**Phase 0 deliverable.** Ground truth for metrics, logs, and tracing across all services. Every claim links to file paths and line references.

---

## Scope

- **Primary stack:** vpn-suite ([`vpn-suite/`](../../vpn-suite))
- **VPN data-plane:** amnezia-awg2 (external repo at `/opt/amnezia/amnezia-awg2`) — critical, metrics-heavy
- **Related:** openclaw, n8n

---

## 1. Service Inventory

### 1.1 vpn-suite services

Sources: [`docker-compose.yml`](../../docker-compose.yml), [`docker-compose.observability.yml`](../../docker-compose.observability.yml), [`prometheus.yml`](../../config/monitoring/prometheus.yml), [`manage.sh`](../../manage.sh) L45–62.

| Service | Path | Lang/Runtime | Ports | Health | Metrics | Logs | Tracing | Profile |
|---------|------|--------------|-------|--------|---------|------|---------|---------|
| **admin-api** | backend/ | Python 3.12, FastAPI | 127.0.0.1:8000 | `GET /health`, `/health/ready` (L71–75) | `GET /metrics` prometheus_client (L251) | JSON + request_id | OTEL optional (`OTEL_TRACES_ENDPOINT`); otherwise trace_id=request_id | core |
| **reverse-proxy** | docker/reverse-proxy/ | Caddy | 80, 443, 8443 | curl `/health` → admin-api (L108–109) | None | Caddy stdout | None | core |
| **postgres** | — | Postgres image | internal | pg_isready (L159) | None | Container only | None | core |
| **redis** | — | Redis image | internal | redis-cli ping (L176) | None | Container only | None | core |
| **telegram-vpn-bot** | bot/ | Python, aiohttp | 127.0.0.1:8090 | `/healthz` (L207) | `GET /metrics` bot_requests_total (L80–81) | structlog JSON | OTEL optional (`OTEL_TRACES_ENDPOINT`) | core |
| **admin-ip-watcher** | scripts/ | docker:24-cli | — | File-based (L138) | None | stdout | None | core |
| **node-agent** | node-agent/ | Python | 9105 | `/healthz` (L777–806) | `GET /metrics` (L777) | minimal stdout | None | agent |
| **prometheus** | — | prom/prometheus | 127.0.0.1:19090→9090 | — | self | — | None | monitoring |
| **alertmanager** | — | prom/alertmanager | 127.0.0.1:19093→9093 | — | — | — | None | monitoring |
| **victoria-metrics** | — | victoriametrics/victoria-metrics | 127.0.0.1:8428 | — | remote_write target | — | None | monitoring |
| **cadvisor** | — | gcr.io/cadvisor | 127.0.0.1:8080 | — | job `cadvisor` `/metrics` | — | None | monitoring |
| **node-exporter** | — | prom/node-exporter | 127.0.0.1:9100 | — | job `node-exporter` | — | None | monitoring |
| **loki** | — | grafana/loki | 127.0.0.1:3100 | — | — | filesystem storage | None | monitoring |
| **promtail** | — | grafana/promtail | 9080 | — | — | Docker logs → Loki | None | monitoring |
| **grafana** | — | grafana/grafana | 127.0.0.1:3000 | — | — | — | None | monitoring |
| **discovery-runner** | ops/discovery/ | Python | — | — | — | stdout | None | monitoring (observability compose) |
| **wg-exporter** | monitoring/wg-exporter/ | Python | 9586 | — | `GET /metrics` (L104) | — | None | monitoring (observability compose) |

**File references:**
- Health: [`docker-compose.yml`](../../docker-compose.yml) L71–75, L108–109, L159, L176, L207
- admin-api metrics: [`backend/app/main.py`](../../backend/app/main.py) L251
- Bot metrics: [`bot/main.py`](../../bot/main.py) L80–81
- Node-agent metrics/health: [`node-agent/agent.py`](../../node-agent/agent.py) L777, L777–806
- Prometheus scrape jobs: [`config/monitoring/prometheus.yml`](../../config/monitoring/prometheus.yml) L12–70
- Logging: [`backend/app/core/logging_config.py`](../../backend/app/core/logging_config.py)

### 1.2 amnezia-awg2 — VPN server (critical)

**Path:** External repo at `/opt/amnezia/amnezia-awg2`. **Role:** VPN data-plane; AmneziaWG runs in container.

| Component | Metrics source | Current state |
|-----------|----------------|---------------|
| **amnezia-awg** container | No native `/metrics` | Health: `/opt/amnezia/amnezia-awg2/docker-compose.yml` L44–49 `awg show <iface>` probe |
| **wg-exporter** (host) | `docker exec <container> wg show <iface> dump` | [`wg_exporter.py`](../../monitoring/wg-exporter/wg_exporter.py) exposes Prometheus metrics |
| **awg show dump** format | Context7: amnezia-vpn/amneziawg-tools | Tab-separated: peer-pubkey, handshake, rx, tx, listen-port, etc. |

**Metrics wg-exporter exposes:**
- `wireguard_up` — scrape success
- `wireguard_peers` — peer count
- `wireguard_listen_port` — listen port
- `wireguard_received_bytes{peer}` — per-peer RX
- `wireguard_sent_bytes{peer}` — per-peer TX
- `wireguard_latest_handshake_seconds{peer}` — seconds since last handshake

**Logs:** Docker json-file, 10m×3 (`/opt/amnezia/amnezia-awg2/docker-compose.yml` L52–56).

### 1.3 Other projects

| Project | Compose | Metrics | Notes |
|---------|---------|---------|-------|
| **openclaw** | [`openclaw/docker-compose.yml`](../../openclaw/docker-compose.yml) | Not instrumented | Node.js gateway |
| **n8n** | [`n8n/docker-compose.yml`](../../n8n/docker-compose.yml) | — | Workflow engine |

---

## 2. Dataflow Diagram

```
METRICS:
  admin-api:8000/metrics ──┐
  telegram-vpn-bot:8090   │
  node-agent:9105         │     file_sd targets.json
  cadvisor:8080           ├──► discovery-runner (optional) ──► Prometheus:9090
  node-exporter:9100      │         │
  wg-exporter:9586 ◄──────┼── amnezia-awg (docker exec wg show dump) — VPN server
  (host.docker.internal)  │
                          └──► Prometheus scrapes (15s) ──► Grafana:3000
                                             └── remote_write ──► VictoriaMetrics:8428
                                                                 │
  admin-api ──► PrometheusQueryService (TELEMETRY_PROMETHEUS_URL) ──► /overview/operator
                                                                      /_debug/metrics-targets
                                                                      health-snapshot

LOGS:
  Docker containers (*-json.log) ──► Promtail:9080 ──► Loki:3100 ──► Grafana (Loki datasource)

TRACES:
  admin-api + bot (OTLP when `OTEL_TRACES_ENDPOINT` set) ──► otel-collector:4317 ──► Tempo:3200 ──► Grafana
  When disabled, trace_id = request_id (logging only).
```

**Configs:**
- Prometheus targets: [`config/monitoring/prometheus.yml`](../../config/monitoring/prometheus.yml) L12–70 (file_sd)
- Targets generation: [`ops/discovery/__main__.py`](../../ops/discovery/__main__.py) L63–128
- Loki ingest: [`config/monitoring/promtail-config.yml`](../../config/monitoring/promtail-config.yml) L20–26
- Grafana datasources: [`config/monitoring/grafana/provisioning/datasources/default.yml`](../../config/monitoring/grafana/provisioning/datasources/default.yml)

---

## 3. Verification Commands

```bash
# List services
cd /opt/vpn-suite && docker compose ps

# With observability compose
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile monitoring ps

# Metrics endpoints (when up)
curl -s http://localhost:8000/metrics | head -20
curl -s http://localhost:8090/metrics | head -20
curl -s http://localhost:19090/api/v1/targets | jq '.data.activeTargets | length'
```
