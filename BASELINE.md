# Baseline Measurements — VPN Suite
> **Date**: 2026-02-26 · **Environment**: docker-compose (single host, NODE_DISCOVERY=docker)

---

## Backend API

### Instrumentation Status

| Signal | Status | Location |
|---|---|---|
| Request timing (P50/P95/P99) | ✅ Collected | `PrometheusMiddleware` — histogram `http_request_duration_seconds` |
| DB query count + timing | ✅ Partial | `DbMetricsMiddleware` + `db_metrics.py` — gauges per request |
| External call timing (node/agent) | ✅ Full | `TimingNodeRuntimeAdapter` wraps all node calls |
| Error rate by endpoint | ✅ | `http_errors_total` counter by `path_template + error_type` |
| Reconciliation cycle | ✅ | `vpn_reconciliation_duration_seconds`, `vpn_reconciliation_drift` |

### Derived Latency Baselines (from code analysis + typical deployment)

| Endpoint | Typical P50 | Worst-Case P95 | Bottleneck |
|---|---|---|---|
| `GET /devices` (0 devices) | ~5 ms | ~15 ms | DB query, no N+1 |
| `GET /devices` (1000 devices) | ~80–150 ms | ~400–600 ms | Full table scan, no server-side pagination by default |
| `GET /telemetry/snapshot` | ~200 ms | ~1.5 s | Fan-out to N WireGuard nodes via docker exec |
| `POST /servers/{id}/peers/issue` | ~300–800 ms | ~2 s | keypair gen + 3× encrypt + node peer add |
| `GET /dashboard/overview` | ~50 ms | ~200 ms | Multiple DB queries, no cache |
| `GET /control-plane/topology` | ~100 ms | ~500 ms | Node discovery + health scoring |
| `POST /agent/heartbeat` | ~10 ms | ~50 ms | Redis write + DB upsert |

### Key Observations

- **Single uvicorn worker** (`--workers 1`) — all async but no process parallelism. CPU-bound work (key gen, config build) blocks the event loop.
- `admin_issue_service.py` calls `build_amnezia_client_config`, `build_wg_obfuscated_config`, and `build_standard_wg_client_config` **3 separate times** with identical inputs — triple the CPU cost.
- Reconciliation loop queries **all non-revoked devices per node** on every 60 s tick even when there is no drift.
- Node telemetry poll (30 s interval) fans out to all nodes with `asyncio.gather` bounded by `node_telemetry_concurrency=10` — good, but each `awg show` docker exec takes 50–500 ms per container.

---

## Frontend

### Bundle Size (admin)

| Build component | Estimated Size | Notes |
|---|---|---|
| Total dist | ~2.5–4 MB (gzipped) | Based on package.json deps + Tailwind tree-shaking |
| Recharts | ~300 KB | Included in admin charts pages |
| React + ReactDOM | ~130 KB | Standard |
| TanStack Query | ~40 KB | Used for data fetching |
| `Devices.tsx` | 40 KB source | Heaviest page — no virtualization |

> **Cannot measure without running build**. CI step `Record bundle size` writes `du -sb frontend/admin/dist` to artifact.

### Polling / Request Volume

| Page | Polling Interval | Requests/min (estimate) |
|---|---|---|
| Dashboard | Based on hooks — likely 30 s | ~2/min |
| Devices page | No visible auto-refresh by default | — |
| Servers | Server-Sent Events / snapshot | 1 req + SSE stream |
| Telemetry | 30 s poll | ~2/min |
| Control Plane (WebSocket) | ws:// persistent | 1 connection |

### TTFB / Render

- Admin SPA: TTFB from Caddy static ~10–30 ms. Full hydration depends on bundle size.  
- `Devices.tsx` (40 KB source): **renders entire device list in DOM** even with 1000+ rows. No virtualization — 1000 rows × ~5 DOM nodes = ~5000 nodes. First render estimated **300–600 ms** on mid-range hardware.

---

## Node-Agent

| Metric | Value |
|---|---|
| Heartbeat interval | 10 s (default) |
| Per-cycle docker exec calls | 2 (docker inspect all, awg show per container) + 2 network checks (sysctl + iptables) |
| Actions poll frequency | Same cycle as heartbeat |
| Agent memory (estimated) | ~30–60 MB RSS |
| Total HTTP calls per minute | ~12 (heartbeat + desired-state + actions) |

**Network check overhead**: Every `_runtime_state()` call executes `sysctl net.ipv4.ip_forward` + `iptables -t nat -n -L POSTROUTING` via docker exec — **2 extra docker exec per node per cycle**, even when nothing changed.

---

## Infrastructure

| Service | Image Size (estimated) | Startup Time | Notes |
|---|---|---|---|
| admin-api | ~350 MB compressed | 5–10 s | python:3.12-slim + deps |
| reverse-proxy | ~50 MB | 2–3 s | Caddy minimal |
| postgres | ~60 MB | 3–5 s | Official slim |
| redis | ~10 MB | <1 s | |
| prometheus | ~98 MB | 3–5 s | 365d retention (⚠ disk heavy) |
| loki | ~65 MB | 2–3 s | |
| grafana | ~400 MB | 5–8 s | |

### ⚠ Resource Limit Gaps (monitoring profile)

`prometheus`, `alertmanager`, `cadvisor`, `node-exporter`, `loki`, `grafana` are in the `monitoring` profile and use the `monitoring_default` anchor which sets **no resource limits**. Under heavy scrape load, these can starve the core services.

---

## CI Pipeline

| Job | Estimated runtime | Bottleneck |
|---|---|---|
| `lint-test` | 3–5 min | pip install (cached), pytest |
| `frontend-checks` | 4–8 min | npm ci, prod build, storybook build |
| `frontend-e2e` | 6–12 min | Full backend + playwright browser spin-up |
| `bot-test` | 1–2 min | pip install |
| `build` | 2–4 min | Docker build (GHA cache) |
| `trivy-scan` | 3–6 min | Docker build again (independent job) |

**`frontend-e2e` and `lint-test` both spin up postgres+redis services independently** — no sharing. `trivy-scan` also rebuilds the Docker image separately, not reusing the `build` job's artifact.

---

## Cannot Measure Without Running

- Real P50/P95/P99 from Prometheus: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` — requires running stack.
- Real bundle size after tree-shake: `npm run build && du -sh frontend/admin/dist/assets/`.
- WireGuard peer handshake latency: requires live VPN tunnel.
