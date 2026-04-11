# Phase 8 — Release Candidate Checklist

**Deliverable:** Final release validation checklist.

---

## 1. Phase Summary

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 0 | change-scope.md | Done |
| 1 | static-validation.md | Done |
| 2 | api-diff.md | Done |
| 3 | runtime-validation.md | Done |
| 4 | observability-check.md | Done |
| 5 | security-check.md | Done |
| 6 | db-check.md | Done |
| 7 | cleanup-summary.md | Done |
| 8 | release-candidate.md | This doc |

---

## 2. Pre-Release Checklist

### Static
- [x] Backend ruff check + format
- [x] Frontend lint + typecheck + build
- [x] No critical lint/type errors

### API
- [x] API diff documented (Outline removed, analytics added)
- [ ] OpenAPI export (`./manage.sh openapi`) — verify

### Runtime
- [ ] Backend pytest (requires DB+Redis)
- [ ] Bot pytest (requires DB)
- [ ] `./manage.sh smoke-staging` (requires stack + admin creds)

### Observability
- [x] Prometheus, Loki, Tempo 365d retention
- [x] Alerts, archive pipeline documented
- [ ] `./manage.sh up-monitoring` — optional smoke

### Security
- [x] Auth, RBAC, rate limits, CORS, redaction documented
- [ ] `pytest tests/test_security.py tests/test_authz_boundaries.py`

### DB
- [ ] Backup before migration
- [ ] `alembic upgrade head` on staging
- [ ] Downgrade/upgrade cycle tested

### Release
- [ ] Uncommitted changes resolved (commit or discard)
- [ ] CHANGELOG updated
- [ ] Tag: `v0.1.0-rc.1` (or final version)

---

## 3. Mandatory Gates (from quality-gates)

- Backend ruff + pytest
- Frontend lint + typecheck + test + build
- DB migration integrity
- Config validate
- No secrets in logs

---

## 4. Breaking Changes

| Change | Impact |
|--------|--------|
| Outline API removed | Clients using /api/v1/outline/* will break |
| Server.integration_type removed | Schema change |
| Device.outline_key_id removed | Schema change |
| OutlineIntegrations UI removed | Users lose Outline UI |

---

## 5. Version

**Current:** 0.1.0-rc.1 (main.py API_VERSION)

---

## 6. Sign-Off

- [ ] All phases reviewed
- [ ] Mandatory gates pass
- [ ] Staging smoke run (optional but recommended)
- [ ] Ready for tag
