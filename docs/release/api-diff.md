# Phase 2 — API Diff

**Deliverable:** OpenAPI/admin endpoint diff vs baseline. API contract changes for release.

---

## 1. Baseline vs Current

| Item | Value |
|------|-------|
| Baseline | Commit `c1cb2d5` (initial) |
| Current | HEAD `47f89feb` |
| API version | 0.1.0-rc.1 |

**Note:** No prior OpenAPI spec stored. Diff inferred from change-scope and route registration.

---

## 2. Endpoint Changes

### 2.1 Removed (Breaking)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/v1/outline/*` | all | Entire Outline API removed; outline.py, outline_client.py, tests deleted |
| `/api/v1/outline/servers` | GET | Outline server list |
| `/api/v1/outline/servers/{id}/keys` | GET/POST | Outline keys management |

**Impact:** Clients depending on Outline API will break. No replacement endpoint.

### 2.2 Added

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/analytics/telemetry/services` | GET | RBAC PERM_CLUSTER_READ | Per-service scrape status for Admin Dashboard |
| `/api/v1/analytics/metrics/kpis` | GET | RBAC PERM_CLUSTER_READ | Request rate, error rate, p95 latency |

**Response schemas:** `TelemetryServicesOut`, `MetricsKpisOut` — see analytics.py.

### 2.3 Modified

| Endpoint | Change |
|----------|--------|
| `GET /api/v1/overview` | Response semantics refined; metrics_freshness shape unchanged |
| `GET /api/v1/overview/health-snapshot` | Same |
| `GET /api/v1/overview/operator` | Operator dashboard data path; semantics refined |

**Compatibility:** Shape preserved; semantic changes only (no schema version bump).

---

## 3. Schema Changes

### 3.1 Server

| Field | Change |
|-------|--------|
| `integration_type` | **Removed** (migration 036) |

### 3.2 Device

| Field | Change |
|-------|--------|
| `outline_key_id` | **Removed** (migration 035) |

### 3.3 Analytics (New)

| Model | Fields |
|-------|--------|
| `ServiceScrapeStatus` | job, instance, health, last_scrape, last_error |
| `TelemetryServicesOut` | services, prometheus_available, message? |
| `MetricsKpisOut` | request_rate_5m, error_rate_5m, latency_p95_seconds, prometheus_available, message? |

---

## 4. Validation Checklist

- [ ] Frontend Admin UI: `/analytics/telemetry/services` wired (ScrapeStatusPanel)
- [ ] Frontend Admin UI: `/analytics/metrics/kpis` wired if KPI panel used
- [ ] No remaining `/outline/*` references in frontend or Caddy
- [ ] Server/Device API consumers aware of removed fields
- [ ] OpenAPI spec exported: `uvicorn app.main:app --reload` → `/openapi.json`

---

## 5. Summary

| Category | Count |
|----------|-------|
| Removed endpoints | 3+ (Outline API) |
| Added endpoints | 2 (analytics) |
| Modified endpoints | 3 (overview) |
| Removed schema fields | 2 (integration_type, outline_key_id) |
| New schema models | 3 (analytics) |

**Recommendation:** Bump minor version on release; document breaking changes in CHANGELOG.
