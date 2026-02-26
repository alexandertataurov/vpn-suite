# Baseline — Measurement and instrumentation

Baseline for the VPN Suite optimization audit. Use this to capture current numbers and re-run after changes.

---

## 1. Current state (measurable)

### Backend HTTP

- **Source:** `scripts/capture_baseline.sh` (run with stack up and `ADMIN_EMAIL` / `ADMIN_PASSWORD` set).
- **Output:** For each of `/api/v1/overview`, `/api/v1/audit?limit=5`, `/api/v1/servers`, `/api/v1/control-plane/automation/status`, `/api/v1/control-plane/events?limit=5`, `/api/v1/telemetry/docker/hosts`: HTTP status, `time_total` (s), `size_download` (bytes).
- **How to run:** `BASELINE_OUT=./baseline_capture.txt ./scripts/capture_baseline.sh`

### Prometheus (request duration)

- **Metrics:** `http_request_duration_seconds` (histogram by `method`, `path_template`), `http_requests_total` (counter by method, path_template, status_class).
- **P50/P95/P99:** From Prometheus, e.g.:
  - `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))`
  - `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
  - `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`
- **Error rate by endpoint:** `rate(http_requests_total{status_class=~"4xx|5xx"}[5m]) / rate(http_requests_total[5m])` by path_template.

---

## 2. Cannot measure (gaps)

| Gap | Reason | Planned fix |
| ----- | ----- | ----- |
| DB query count per request | No middleware or event listener | Optional middleware or SQLAlchemy `after_cursor_execute` listener to record count and total DB time per request |
| DB time per request | Same | Same as above; expose as histogram or summary |
| External (node) call timing | Node runtime adapter not instrumented | Add timing around `list_peers` / apply in `node_runtime` or adapter; expose histogram |
| Frontend TTFB / hydration | No RUM in repo | Document manual: Chrome DevTools Network (TTFB), Lighthouse (LCP/CLS) or add minimal RUM later |
| Devices page render (e.g. 1k rows) | No automated measure | Manual or Lighthouse; optional: `performance.measure()` in key components |
| Frontend bundle size | No CI gate | Add `npm run build` artifact size or `rollup-plugin-visualizer`; record in BASELINE_OUT or CI |
| Polling cost (requests/min) | Not aggregated | Derive from refetchInterval in code (e.g. Devices 60s => 1/min per client for list + summary) and document |
| Container CPU/RAM, startup time | No capture in repo | One-line script or compose healthcheck timing; `docker stats` / `docker images` for image size |

---

## 3. Infra (image size and startup)

- **Image sizes:** Run `docker images` and record size for `vpn-suite-admin-api`, `amnezia-awg2` (or equivalent). Example: `docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | grep -E "vpn-suite-admin-api|amnezia"`.
- **Startup time:** Optional one-liner: time from `docker compose up -d` until `curl -sf http://localhost:8000/health` returns 200 (e.g. loop with `sleep 1` and timestamp diff).

---

## 4. Minimal instrumentation to add

1. **Backend — DB per request (optional):**  
   Add middleware or a dependency that, per request, counts `session.execute()` calls and sums DB time (e.g. via SQLAlchemy `after_cursor_execute`), and records:
   - Counter: `db_queries_per_request` (or histogram with buckets).
   - Histogram: `db_time_per_request_seconds`.  
   Then re-run baseline and record typical values for `/api/v1/devices`, `/api/v1/devices/summary`, `/api/v1/servers`.

2. **Backend — Node call duration:**  
   In `node_runtime` / adapter, wrap `list_peers` (and apply if desired) with a timer; record `node_runtime_call_duration_seconds` (histogram) by operation. Document P95 for list_peers under load.

3. **Frontend — Bundle size:**  
   In CI or locally, run `npm run build` in `frontend/` and record size of `admin/dist/` (and key chunks). Add to BASELINE.md or a small script that appends to baseline_capture.txt.

4. **Infra:**  
   Record `docker images` size for `vpn-suite-admin-api` (or equivalent). Optionally: time from `docker compose up` until admin-api healthcheck passes.

---

## 5. How to re-run baseline

1. **Backend + curl:** Ensure stack is up; set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ENV_FILE`. Run:
   ```bash
   BASELINE_OUT=./baseline_capture.txt ./scripts/capture_baseline.sh
   ```
2. **Prometheus:** If Prometheus is scraping the admin-api, query the histograms and counters above over a 5–15 min window during normal or load traffic.
3. **Frontend:** Open `/admin` in Chrome; DevTools → Network (check TTFB, response sizes); Console (errors); Lighthouse for LCP/CLS if desired.
4. **Bundle:** From repo root: `cd frontend && npm run build` and inspect `admin/dist/` size and chunk sizes.
5. **Containers:** `docker images`, `docker compose ps`, and optionally `docker stats` for CPU/RAM during baseline capture.

### Added instrumentation (audit)

- **DB per request:** `db_queries_per_request` and `db_time_per_request_seconds` histograms (labels: method, path_template). Set via `DbMetricsMiddleware` and SQLAlchemy `before_cursor_execute` / `after_cursor_execute` on the engine.
- **Node call duration:** `node_runtime_call_duration_seconds` histogram (labels: operation, adapter). Recorded by `TimingNodeRuntimeAdapter` wrapping the real adapter for `list_peers`, `add_peer`, `remove_peer`.
- **Frontend bundle:** CI step records `frontend/admin/dist` size (see `.github/workflows/ci.yml`).

After adding the optional instrumentation above, re-run and update this doc with sample numbers (e.g. “GET /api/v1/devices P95 = 0.12s”, “db_queries_per_request for /devices = 3”).
