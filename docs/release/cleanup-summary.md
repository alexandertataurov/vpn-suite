# Phase 7 — Cleanup Summary

**Deliverable:** Pre-release cleanup checklist.

---

## 1. Static / Code Cleanup (Done)

| Item | Status |
|------|--------|
| Backend ruff check | PASS |
| Backend ruff format | PASS |
| Frontend lint | PASS |
| Frontend typecheck | PASS |
| ScrapeStatusPanel InlineAlert | Fixed (message prop) |
| Stories eslint-disable | Fixed (ConfigContentModal, IssueConfigModal) |

---

## 2. Uncommitted Changes (per change-scope)

| Type | Files |
|------|-------|
| Modified | .env.example, README.md, docker-compose.observability.yml, docs/*, tailwind.config.ts, run_loop.py |
| Deleted | docs/observability/system-map.md, docs/security/hardening-action-plan.md, hardening-checklist.md |
| Untracked | docs/guides/, docs/observability/archive-pipeline.md, docs/security/README.md, docs/security/hardening.md, docs/specs/README.md, scripts/archive-loki-to-s3.sh |

**Action:** Review, commit, or discard before tagging.

---

## 3. Optional Cleanup

- [x] Legacy schema references cleaned in migrations (032/033/035/036)
- [ ] Update CHANGELOG with breaking changes
- [ ] Ensure .env.example has all required vars documented
- [ ] Run `./manage.sh smoke-staging` end-to-end (requires stack)

---

## 4. Summary

| Area | Status |
|------|--------|
| Lint / typecheck | Done |
| Code fixes | Done |
| Uncommitted changes | Document; decide before release |
| CHANGELOG | Optional update |
