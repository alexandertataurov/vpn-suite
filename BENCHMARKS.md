# Benchmarks - Optimization Audit

How to measure before/after and validate improvements.

## Backend

**Capture baseline:** With stack up and ADMIN_EMAIL/ADMIN_PASSWORD set, run:
`BASELINE_OUT=./baseline_capture.txt ./scripts/capture_baseline.sh`

**Prometheus:** http_request_duration_seconds (P50/P95 by path_template). After instrumentation: db_queries_per_request, db_time_per_request_seconds, node_runtime_call_duration_seconds.

**Load test (optional):** hey or k6 against GET /api/v1/servers, GET /api/v1/devices?limit=50, GET /api/v1/telemetry/snapshot?fields=meta,nodes.summary. Record RPS and P95.

## Frontend

**Bundle size:** After `cd frontend && npm run build`, inspect admin/dist size. CI records in frontend/dist-size.txt and uploads artifact.

## Infra

**Image sizes:** docker images for vpn-suite-admin-api, amnezia-awg2. **Startup:** time until curl http://localhost:8000/health returns 200.

## Before/after (audit changes)

- Servers list: 3 queries -> 2 (count + list with last_seen join). Validate: db_queries_per_request for GET /api/v1/servers.
- Devices list: no cache -> 45s Redis cache. Validate: second GET /api/v1/devices faster.
- DB/node metrics: added. Validate: Prometheus /metrics.
- Devices VirtualTable: when table view and (length or total or limit >= 50). Validate: manual.
- Devices staleTime: 45_000 ms. Validate: fewer refetches on tab focus.
- Bundle size in CI: artifact frontend-dist-size. Validate: CI job.
- Backend HEALTHCHECK: added. Validate: docker inspect.
- Telemetry snapshot metric: labels scope, fields_filter. Validate: Prometheus.
