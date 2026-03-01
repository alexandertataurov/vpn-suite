# VPN Suite Pre-Release Review (2026-02-28)

## 1) Executive summary

Release-blocking hardening was implemented for Admin + API + Telemetry on the highest-risk flows:

- **Correctness blocker fixed:** `/api/v1/servers/device-counts` now resolves correctly (no route shadowing by `/{server_id}`).
- **Security hardening shipped:** dangerous app settings endpoints are behind granular RBAC and env-editor feature gating.
- **Reliability hardening shipped:** idempotency added for sync/reissue with deterministic replay response.
- **Observability hardening shipped:** correlation/request IDs are propagated FE -> API and surfaced in UI debug packets.
- **Telemetry ingestion shipped:** batched frontend event intake endpoint with schema version, redaction, sampling, and metrics.

Operational incident during verification (host disk full -> Postgres recovery loop) was remediated by reclaiming disk and restarting Postgres; verification was re-run after recovery.

## 2) Discovery and repo map

### Services and entrypoints

- Admin SPA: `frontend/admin` (React + Vite, router basename `/admin`)
- API: `backend/app/main.py` (FastAPI, `/api/v1/*`, `/metrics`, `/health`, `/health/ready`)
- Background/aux: `admin-worker`, `bot`, `node-agent`
- Observability stack: Prometheus/Loki/Grafana/Tempo/OTel via `docker-compose*.yml` and `config/monitoring/*`

### Commands and CI

- CI: `.github/workflows/ci.yml`
- Ops helpers: `manage.sh`, `scripts/verify.sh`, `scripts/release_api_happy_path.sh`
- Verified commands in this review:
  - `./manage.sh config-validate`
  - `BASE_URL=http://127.0.0.1:8000 bash scripts/release_api_happy_path.sh`
  - `docker run ... pytest ...` (containerized backend tests)
  - `cd frontend && npm test -- --run`

### Runtime model

- Envs: development/staging/production (via env settings)
- Public base paths: `/admin/*`, `/webapp/*`, `/api/*`, `/health`, mTLS agent path `/api/v1/agent/*` on `:8443`
- Auth model: Admin JWT Bearer, stored in `sessionStorage` on FE
- Telemetry:
  - Structured JSON logs + request/correlation IDs
  - Prometheus metrics (`/metrics`)
  - OTel wiring present in API

### Release-critical surface

- Login + token refresh
- Servers list/details, device counts
- Device issue/reissue/revoke
- Sync/reconcile flows
- Telemetry charts/degraded states
- Admin settings dangerous actions
- Audit trail

## 3) Release gate status

| Gate | Status | Evidence |
|---|---|---|
| Security | **PASS (scope)** | Dangerous settings gating + capabilities in `backend/app/api/v1/app_settings.py`; env gate response in `reports/release-api-ui-verification/samples/app_env_disabled_body.json`; authz tests pass in container run (see section 5) |
| Correctness | **PASS** | `/servers/device-counts -> 200` in `reports/release-api-ui-verification/happy_path_results.txt`; route regression test `backend/tests/test_servers_routes_precedence.py` passes |
| Observability | **PASS (scope)** | `X-Request-ID`/`X-Correlation-ID` echo in `reports/release-api-ui-verification/samples/headers_echo_health.txt`; telemetry ingest responses in `telemetry_events_ingest.json` and `telemetry_login_failure_noauth.json`; metrics snippet in `frontend_telemetry_metrics_snippet.txt` |
| Performance | **PARTIAL** | No new regressions observed in tested flows; frontend build warning remains for large vendor chunks (existing) |
| Reliability | **PASS (scope)** | Idempotency replay evidence in `sync_idempotency_replay.json`; tests `backend/tests/test_idempotency_sync_reissue.py` pass |
| UX | **PASS (scope)** | `PageError` debug packet + copy affordance implemented; servers/settings critical pages updated with consistency layer and improved degraded/error behavior |
| Testing | **PASS (scope)** | Backend hardening suites and baseline backend suites pass in containerized run; frontend lint/typecheck/vitest pass; Playwright smoke runs cleanly (6 passed, 6 skipped for data-dependent paths) |
| Operability | **PASS (scope)** | Runbook updated with node-metrics debug and end-to-end trace workflow in `docs/ops/runbook.md` |

## 4) Changelog

### Admin UI

- Fixed device-counts fallback lockout on servers page; switched to bounded retry + explicit degraded banner.
- Added per-tab correlation + per-request IDs in API client headers.
- Added idempotency headers for sync/reissue actions.
- Added debug packet surface (endpoint, status, request_id, correlation_id) in shared `PageError`.
- Added minimal critical-page consistency layer (`PageLayout`, `Section`) and applied to Servers/Settings.
- Added telemetry event instrumentation for login/filter/sort/sync/reissue flows.
- Added chart formatter SSOT module and tests.

### API

- Fixed route precedence by moving generic CRUD server routes after static subroutes.
- Added permissions: `settings:read`, `settings:write`, `settings:dangerous`.
- Hardened settings endpoints:
  - `/api/v1/app/settings` now includes capabilities.
  - `/api/v1/app/env` requires dangerous permission + `APP_ENV_EDITOR_ENABLED`.
  - `/api/v1/app/settings/cleanup-db` requires dangerous permission.
- Added Redis-backed idempotency support and wired it to:
  - `POST /api/v1/servers/{server_id}/sync`
  - `POST /api/v1/devices/{device_id}/reissue`
- Standardized correlation propagation in request logging and error envelopes.

### Telemetry

- Added `POST /api/v1/log/events` batch endpoint with schema version checks, redaction, sampling, and metrics.
- Allowed unauthenticated ingest for pre-auth flows (e.g., login failure telemetry).
- Added Prometheus counters:
  - `frontend_telemetry_events_total{event,result}`
  - `frontend_telemetry_batches_total{result}`

## 5) Test and validation evidence

### Backend tests (containerized, reproducible)

Command:

```bash
docker run --rm -v /opt/vpn-suite/backend:/workspace -w /workspace vpn-suite-admin-api \
  sh -lc 'pip install --no-cache-dir --target /tmp/pytestpkgs pytest pytest-asyncio >/tmp/pip_pytest.log 2>&1 && \
          PYTHONPATH=/tmp/pytestpkgs PYTHONDONTWRITEBYTECODE=1 python -m pytest -p no:cacheprovider \
          tests/test_servers_routes_precedence.py \
          tests/test_app_settings_authz.py \
          tests/test_idempotency_sync_reissue.py \
          tests/test_frontend_telemetry_ingest.py -v'
```

Result: **13 passed**.

Additional baseline backend command from plan:

```bash
docker run --rm -v /opt/vpn-suite/backend:/workspace -w /workspace vpn-suite-admin-api \
  sh -lc 'pip install --no-cache-dir --target /tmp/pytestpkgs pytest pytest-asyncio >/tmp/pip_pytest.log 2>&1 && \
          PYTHONPATH=/tmp/pytestpkgs PYTHONDONTWRITEBYTECODE=1 python -m pytest -p no:cacheprovider \
          tests/test_servers_api.py tests/test_servers_peers_api.py tests/test_authz_boundaries.py tests/test_observability_middleware.py -v'
```

Result: **9 passed, 1 skipped**.

### Frontend tests

- `cd frontend && npm run lint && npm run typecheck && npm test -- --run` -> **passed** (`shared`, `admin`, `miniapp`); only non-blocking admin lint warnings remain

### E2E smoke

- `cd frontend && npm run test:e2e -- --grep "Release smoke|Servers"` -> **passed** with **6 passed, 6 skipped** (skips are expected for data-dependent flows when no matching entities are present)

### API happy path

- `BASE_URL=http://127.0.0.1:8000 bash scripts/release_api_happy_path.sh`
- `reports/release-api-ui-verification/happy_path_results.txt` includes:
  - `GET /api/v1/servers/device-counts -> 200`

### Telemetry + correlation evidence

- `reports/release-api-ui-verification/samples/telemetry_login_failure_noauth.json`
- `reports/release-api-ui-verification/samples/telemetry_events_ingest.json`
- `reports/release-api-ui-verification/samples/frontend_telemetry_metrics_snippet.txt`
- `reports/release-api-ui-verification/samples/headers_echo_health.txt`

## 6) Open risks / blockers

- Global `cd backend && ruff check .` still reports many pre-existing violations outside this hardening scope; touched release files are clean under targeted Ruff checks.
- E2E selector filter forwarding via `npm run test:e2e -- --grep ...` is currently ignored by npm workspace forwarding and executes the full `servers-users` suite.

## 7) Ordered PR plan

1. **PR1 API correctness blocker**: route precedence + servers fallback behavior + regression test.
2. **PR2 settings security hardening**: granular RBAC + env editor production gate + settings capabilities + tests.
3. **PR3 idempotency/correlation**: sync/reissue idempotency + request/correlation propagation + tests.
4. **PR4 critical UI hardening**: debug packet surfacing + consistency primitives on Servers/Settings.
5. **PR5 telemetry ingest E2E**: backend batch endpoint + frontend batching/instrumentation + tests.
6. **PR6 chart format SSOT**: chart formatter consolidation + chart formatter tests.
7. **PR7 release artifacts**: runbooks + review doc + rollback + verification checklist.
