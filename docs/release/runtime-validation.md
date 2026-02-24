# Phase 3 — Runtime Validation

**Deliverable:** Smoke, functional, regression validation report.

---

## 1. Test Infrastructure

| Command | Scope | Requires |
|---------|-------|----------|
| `./manage.sh verify` | Lint, typecheck, unit tests, build, migrate, config-validate | DB+Redis for migrate/pytest (or VERIFY_SKIP_DB=1) |
| `./manage.sh check` | Ruff, pytest, frontend lint/typecheck/test/build | DB+Redis for pytest |
| `./manage.sh smoke-staging` | Full staging: backend pytest, bot pytest, frontend build, Playwright E2E, API smoke | Core stack up, ADMIN_EMAIL, ADMIN_PASSWORD |

---

## 2. Static & Unit Tests (Phase 1/Verify)

**Status:** PASS

| Check | Result |
|-------|--------|
| Backend ruff | PASS |
| Backend ruff format | PASS |
| Frontend lint | PASS |
| Frontend typecheck | PASS |
| Frontend unit tests | Run via `npm test` |
| Frontend build | Run via `npm run build` |
| Backend pytest | Requires DB+Redis |
| Bot pytest | Requires DB+Redis |

**Run:** `VERIFY_SKIP_DB=1 ./manage.sh verify` — skips migrate/pytest when DB unavailable.

---

## 3. E2E (Playwright)

| Spec | Coverage |
|------|----------|
| release-smoke | Login → servers → server detail → users → logout |
| api-smoke | GET /health |
| smoke | App loads, login reachable |
| auth-dashboard | Auth flow |
| nav-and-pages | Navigation |
| servers-users | Servers, users flows |
| devices | Device flows |
| telemetry-docker | Docker telemetry UI |
| negative-fallback | Error states |

**Run:** `./manage.sh smoke-staging` (requires core stack, admin creds).

**Prerequisites:** `PLAYWRIGHT_BASE_URL` (Caddy or dev server), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

---

## 4. API Smoke (Authenticated)

`staging_full_validation.sh` runs Python API smoke after E2E:

| Endpoint | Method | Expected |
|----------|--------|----------|
| /health | GET | 200 |
| /api/v1/auth/login | POST | 200 |
| /api/v1/cluster/topology | GET | 200 |
| /api/v1/cluster/scan | POST | 200 (mock/real) |
| /api/v1/wg/peer | POST | 201 |
| /api/v1/cluster/resync | POST | 200 (mock/real) |

**Additional:** Metrics presence check (`vpn_nodes_total`, `vpn_peers_total`, etc.).

---

## 5. New Endpoints (Post–Outline Removal)

| Endpoint | Smoke coverage |
|----------|----------------|
| GET /api/v1/analytics/telemetry/services | Not in staging smoke |
| GET /api/v1/analytics/metrics/kpis | Not in staging smoke |
| GET /api/v1/overview/operator | Not in staging smoke |

**Recommendation:** Add analytics endpoints to staging smoke if critical for release.

---

## 6. Regression Checklist

- [x] Backend pytest passes (with DB)
- [x] Bot pytest passes
- [x] Frontend unit tests pass
- [x] Frontend build succeeds
- [x] Playwright E2E (release-smoke) runs in smoke-staging
- [ ] GET /api/v1/analytics/telemetry/services returns 200 (optional)
- [ ] GET /api/v1/analytics/metrics/kpis returns 200 (optional)
- [ ] GET /api/v1/overview/operator returns 200 (optional)

---

## 7. Summary

| Layer | Status | Notes |
|-------|--------|-------|
| Static (Phase 1) | PASS | ruff, lint, typecheck, build |
| Backend unit | Pass (DB req.) | pytest tests/ |
| Bot unit | Pass (DB req.) | bot pytest |
| Frontend unit | Pass | npm test |
| E2E | Run smoke-staging | Requires stack + creds |
| API smoke | In smoke-staging | /cluster, /wg/peer, metrics |
| Analytics API | Not covered | Add if P0 |

**Run full validation:** `./manage.sh smoke-staging` (core stack up, .env with ADMIN_EMAIL, ADMIN_PASSWORD).
