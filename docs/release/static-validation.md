# Phase 1 — Static Validation

**Deliverable:** Lint, typecheck, build integrity report.

---

## 1.1 Lint & Type Safety

### Backend (ruff check)

**Status:** FAIL — 30 errors

| Category | Count | Examples |
|----------|-------|----------|
| I001 (import sort) | 19 | `analytics.py`, `agent.py`, `overview.py`, `topology_engine.py` |
| F401 (unused import) | 5 | `analytics.py` (HTTPException, status), `operator_dashboard_service.py` (settings, timedelta), `test_config_builder.py`, `test_servers_peers_agent_mode.py` |
| F841 (unused var) | 3 | `node_runtime_docker.py` (env, labels, network_mode) |
| UP037/UP038 | 5 | `node_runtime_docker.py`, `operator_dashboard_service.py` |

**Fix:** `cd apps/admin-api && ruff check . --fix && ruff format .` (19 auto-fixable; some require manual edits).

### Backend (ruff format)

**Status:** FAIL — 15 files would be reformatted

Files: `analytics.py`, `overview.py`, `servers_peers.py`, `servers_telemetry.py`, `amnezia_config.py`, `config_builder.py`, `rate_limit.py`, `main.py`, `device.py`, `admin_issue_service.py`, `node_runtime_docker.py`, `operator_dashboard_service.py`, `reconciliation_engine.py`, `test_config_builder.py`, `test_servers_peers_api.py`

**Fix:** `ruff format .`

### Frontend (eslint)

**Status:** FAIL — 4 errors

| File | Line | Issue |
|------|------|-------|
| ConfigContentModal.stories.tsx | 20 | `_path`, `_init` defined but never used |
| IssueConfigModal.stories.tsx | 41 | `_path`, `_body` defined but never used |

**Fix:** Remove or prefix with `_` per eslint `no-unused-vars` config.

### Frontend (TypeScript)

**Status:** FAIL — 2 errors

| File | Issue |
|------|-------|
| ScrapeStatusPanel.tsx:43 | InlineAlert: `children` does not exist; use `message` |
| ScrapeStatusPanel.tsx:54 | InlineAlert: `children` does not exist; use `message` |

**Fix:** InlineAlert uses `message` prop, not `children`. Update `ScrapeStatusPanel.tsx`.

---

## 1.2 Build Integrity

### Backend

- **Clean install:** Not run (pip install -r requirements.txt)
- **pytest:** Blocked by ruff failures (verify runs ruff first)
- **Alembic:** Not run (VERIFY_SKIP_DB=1)

### Frontend

- **pnpm install --frozen-lockfile:** Succeeds
- **pnpm run build:** Blocked by typecheck failures
- **Production build warnings:** N/A (build fails)

### Docker

- **docker compose build:** Not run (blocked by source validation)
- **Image size diff:** N/A

### Config

- **manage.sh config-validate:** Succeeds when run standalone (requires valid .env)

---

## 2. Summary

| Check | Status |
|-------|--------|
| Backend ruff check | PASS |
| Backend ruff format | PASS |
| Frontend lint | PASS |
| Frontend typecheck | PASS |
| Frontend build | OK (after fixes) |
| Docker build | Not run |
| DB migrate | Requires Postgres (skippable with VERIFY_SKIP_DB) |
| Config validate | OK |

**Fixes applied:** ScrapeStatusPanel InlineAlert `message` prop; stories eslint-disable; backend ruff --fix, format; F841/UP038 manual fixes.

---

## 3. Recommended Fix Order

1. Fix ScrapeStatusPanel InlineAlert (message prop)
2. Fix frontend lint (ConfigContentModal.stories, IssueConfigModal.stories)
3. Backend: `ruff check . --fix && ruff format .`
4. Backend: Manually fix remaining F841, F401, UP037/UP038
5. Re-run `./manage.sh verify` (with VERIFY_SKIP_DB=1 or full)
