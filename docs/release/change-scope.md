# Phase 0 — Release Validation: Change Scope

**Deliverable:** Structured change summary with risk assessment.

---

## 1. Baseline Identification

| Item | Value |
|------|-------|
| **Last stable tag** | None (0 tags in repo) |
| **Baseline** | Initial commit `c1cb2d5` (chore: initial commit with agents and skills) |
| **Current branch** | `main` |
| **Current commit** | `47f89feb531df57271dbc64324d8fe005e6cc8c5` |
| **Uncommitted changes** | Yes — modified/deleted + untracked (observability session) |

**Note:** First release candidate. No prior tags exist; diff is from initial commit to HEAD plus uncommitted working tree.

---

## 2. Git Diff Summary

**Committed (c1cb2d5..HEAD):**
- **235 files changed**, +5,494 insertions, -5,203 deletions
- Net: +291 lines

**Uncommitted (as of audit):**
- Modified: `.env.example`, `README.md`, `docker-compose.observability.yml`, `docs/*`, `frontend/admin/tailwind.config.ts`, `ops/discovery/run_loop.py`, `docs/security/*`
- Deleted: `docs/observability/system-map.md`, `docs/security/hardening-action-plan.md`, `docs/security/hardening-checklist.md`
- Untracked: `docs/guides/`, `docs/observability/archive-pipeline.md`, `docs/security/README.md`, `docs/security/hardening.md`, `docs/specs/README.md`, `scripts/archive-loki-to-s3.sh`

**Key uncommitted:** ScrapeStatusPanel wiring, archive pipeline, discovery remote targets, inventory removal, security docs restructure.

---

## 3. Categorized Changes

### 3.1 Backend

| Change | Files | Risk |
|--------|-------|------|
| Outline integration removed (unsupported) | `outline.py` (D), `outline_client.py` (D), schema (D), tests (D). Outline is off by default; use AmneziaWG + node-agent only. | **High** — Breaking if clients depended on Outline API |
| Analytics API added | `backend/app/api/v1/analytics.py` (new) — `/analytics/telemetry/services`, `/analytics/metrics/kpis` | Low — additive |
| OpenTelemetry tracing | `backend/app/core/otel_tracing.py` (new), `main.py`, `config.py` | Low — opt-in via `OTEL_TRACES_ENDPOINT` |
| Overview / operator dashboard | `overview.py`, `operator_dashboard_service.py`, `servers_telemetry.py` | Medium — core dashboard data path |
| Schema / models | `server.py` (schemas/models), `device.py` — Outline fields removed | High — DB migrations |
| Dependencies | `requirements.in`, `requirements.txt` — OTEL, outline-related removed | Medium — build/test impact |
| Migrations | `035_drop_devices_outline_key_id.py`, `036_drop_servers_integration_type.py` | High — irreversible column drops |

### 3.2 Frontend

| Change | Files | Risk |
|--------|-------|------|
| OutlineIntegrations page removed | `OutlineIntegrations.tsx` (D), `App.tsx` route removed | **High** — users lose Outline UI |
| New observability UI | `ScrapeStatusPanel.tsx`, `GlobalDataIndicator.tsx`, `Telemetry.tsx` | Low — additive |
| Operator dashboard | `OperatorDashboardContent.tsx`, `IncidentPanel.tsx`, `UserSessionsTable.tsx` | Medium — dashboard UX changes |
| Resource system | `useResource.ts`, `resourceRegistry.ts`, `ResourceDebugPanel.tsx` | Low — internal |
| Shared types | `admin-api.ts` — Outline types removed | Medium — type breaking if consumers exist |

### 3.3 Infrastructure

| Change | Files | Risk |
|--------|-------|------|
| Docker compose | `docker-compose.yml`, `docker-compose.observability.yml` — inventory removed, OTEL env | Medium — service topology |
| Caddy | `Caddyfile` — Outline routes removed | Low |
| Prometheus | `prometheus.yml` — relabel_configs, wg-exporter | Low |
| Loki | `loki-config.yml` — retention 365d | Low |
| Tempo | `tempo/tempo.yaml` (new) — OTLP backend | Low |
| OTEL Collector | `otel-collector/config.yaml` (new) | Low |
| Grafana | `vpn-overview.json` (new), Tempo datasource | Low |

### 3.4 API Contracts

| Change | Impact |
|--------|--------|
| **Removed** | `GET /api/v1/outline/*` (entire Outline API) |
| **Removed** | Server schema: `integration_type`; Device schema: `outline_key_id` |
| **Added** | `GET /api/v1/analytics/telemetry/services`, `GET /api/v1/analytics/metrics/kpis` |
| **Modified** | `/overview/*` responses (health-snapshot, operator) — `metrics_freshness` shape unchanged, semantics refined |

### 3.5 Database Schema

| Migration | Action | Risk |
|-----------|--------|------|
| 035 | `DROP COLUMN devices.outline_key_id` | High — irreversible |
| 036 | `DROP COLUMN servers.integration_type` | High — irreversible |

**Rollback:** Downgrade adds columns back with defaults. Data in dropped columns is lost.

### 3.6 Observability

| Change | Risk |
|--------|------|
| discovery-runner: `DISCOVERY_REMOTE_WG_EXPORTERS` for multi-host | Low |
| wg-exporter: `node_id`, `server_id` labels from env | Low |
| Inventory service removed from compose | Low — was disabled |
| Archive pipeline docs + script | Low |

### 3.7 Security

| Change | Risk |
|--------|------|
| Outline API removal — reduces attack surface | Low |
| Rate limit middleware changes | Medium — verify coverage |
| Security docs deleted/restructured | Low |

---

## 4. Risk Assessment Matrix

| Risk Level | Count | Key Items |
|------------|-------|-----------|
| **High** | 3 | Outline removal (API, UI, DB), migrations 035/036 |
| **Medium** | 3 | Overview/operator, rate limit, shared types |
| **Low** | 4+ | Analytics, OTEL, observability, archive |

---

## 5. Full File List (Committed)

**Added (A):** analytics.py, otel_tracing.py, 035/036 migrations, test_peers_contract.py, vpn-overview.json, tempo.yaml, otel-collector config, docs (observability, api, audits, backlog, frontend, guides, specs), GlobalDataIndicator.tsx, ResourceDebugPanel.tsx, ScrapeStatusPanel.tsx, useResource.ts, resourceRegistry.ts, resourceDebug.ts, FILE_INVENTORY.md

**Modified (M):** .env.example, CHANGELOG.md, README.md, overview.py, servers*.py, config.py, main.py, requirements.*, Caddyfile, prometheus.yml, loki-config.yml, docker-compose*, wg_exporter.py, run_loop.py, frontend (App, Telemetry, Dashboard, OperatorDashboardContent, ServerRow, types, etc.), manage.sh

**Deleted (D):** Outline API/schema/client/tests, outline-poller, outline scripts, BASELINE.md, DATA_CONTRACT.md, VALIDATION.md, DASHBOARDS/outline-view.json, docs (BACKLOG, CODEBASE_MAP, api-audit/*, api-overview, outline-integration, reference, system-map, hardening-action-plan, hardening-checklist)

---

## 6. Next Steps

- **Phase 1:** Lint, typecheck, clean build, Docker build
- **Phase 2:** OpenAPI diff, admin endpoint validation
- **Phase 3:** Smoke tests, functional tests, regression
- **Phase 4:** Observability verification
- **Phase 5:** Security check
- **Phase 6:** DB migration safety
- **Phase 7:** Cleanup
- **Phase 8:** Final release checklist
