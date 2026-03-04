# Admin page baseline capture

How to capture baseline for /admin (network, console, Web Vitals, backend logs).

## Automated (script)

With stack running and `.env` containing `ADMIN_EMAIL` and `ADMIN_PASSWORD`:

```bash
./scripts/capture_baseline.sh
```

Output: `baseline_capture.txt` with API request status/time/size and last 100 lines of admin-api logs.

## Manual (browser)

1. **Network** — Open https://vpn.vega.llc/admin (or http://localhost:80/admin), DevTools → Network. Reload; export HAR or note URL, status, time, size for each request.
2. **Console** — DevTools → Console; note any errors/warnings and stack traces.
3. **Web Vitals** — Run Lighthouse (LCP, CLS, INP) or use Web Vitals extension; record numbers.

## Optional E2E baseline

Playwright can record HAR and console when running existing E2E:

```bash
cd frontend/admin && PLAYWRIGHT_BASE_URL=http://localhost:5174/admin npx playwright test --project=chromium smoke.spec.ts --trace=on
```

Traces and HAR are in `frontend/admin/test-results/`.

### E2E against real backend

With the full stack up (Caddy + admin API + frontend), run Playwright without the dev server so it hits the real app:

```bash
cd frontend/admin
npm run build
PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_BASE_URL=https://vpn.vega.llc npx playwright test
```

Or for a single run against local: `PLAYWRIGHT_BASE_URL=http://localhost npx playwright test --project=chromium`.

## Perf smoke (200+ servers)

To verify the Servers page does not freeze with a large list:

1. **E2E (mocked):** Run `cd frontend/admin && npm run test:e2e -- negative-fallback.spec.ts` — the "Servers page renders with 200 mocked servers" test mocks 200 items and asserts the page loads.
2. **Manual:** Seed 200+ servers (e.g. via backend script or API), open /admin/servers, confirm the list renders and scrolling is responsive. If the UI freezes, consider adding table virtualization (e.g. tanstack/react-virtual).

---

## Baseline measurements (2026-02-26)

Environment: docker-compose (single host, NODE_DISCOVERY=docker).

### Backend API

| Signal | Status | Location |
|--------|--------|----------|
| Request timing (P50/P95/P99) | Collected | `PrometheusMiddleware` — histogram `http_request_duration_seconds` |
| DB query count + timing | Partial | `DbMetricsMiddleware` + `db_metrics.py` |
| External call timing (node/agent) | Full | `TimingNodeRuntimeAdapter` |
| Error rate by endpoint | Yes | `http_errors_total` by `path_template + error_type` |
| Reconciliation cycle | Yes | `vpn_reconciliation_duration_seconds`, `vpn_reconciliation_drift` |

Derived latency (typical): `GET /devices` ~5–15 ms (0 devices), ~80–400 ms (1000); `GET /telemetry/snapshot` ~200 ms–1.5 s; `POST /servers/{id}/peers/issue` ~300 ms–2 s; `POST /agent/heartbeat` ~10–50 ms.

### Frontend

Bundle: total dist ~2.5–4 MB gzipped; Recharts ~300 KB; Devices.tsx heaviest page, no virtualization. Polling: Dashboard ~30 s; Telemetry ~30 s.

### Node-Agent

Heartbeat 10 s; ~12 HTTP calls/min; sysctl + iptables exec per cycle.

### CI

lint-test 3–5 min; frontend-checks 4–8 min; frontend-e2e 6–12 min; build 2–4 min.
