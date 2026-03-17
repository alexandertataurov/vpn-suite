# Documentation Overhaul — Phase 6 Deliverables (2026-03)

**Later consolidation (scan):** Remaining drifting docs moved into `docs/`: `frontend/admin/docs/navigation-patterns-catalog.md` → `docs/frontend/navigation-patterns-catalog.md`; `frontend/miniapp/LAYOUT-ARCHITECTURE.md` → `docs/frontend/miniapp-layout-architecture.md`; `bot/docs/RELEASE.md`, `PRODUCTION_PLAN.md`, `BOT_MENU_ARCHITECTURE.md` → `docs/bot/release.md`, `production-plan.md`, `bot-menu-architecture.md`. Redirect READMEs left in `frontend/admin/docs/`, `bot/docs/`, and `frontend/miniapp/README.md` added.

## 1. Audit Summary

Disposition key: **KEEP** = current, essential; **UPDATE** = refresh links/version/format; **MERGE** = consolidated into another doc; **LEGACY/REDUNDANT/DELETE** = removed or archived.

| Path | Disposition |
|------|-------------|
| README.md | UPDATE (rewritten) |
| CHANGELOG.md | UPDATE (Keep a Changelog) |
| CONTRIBUTING.md | KEEP |
| AGENTS.MD | KEEP |
| docs/README.md | UPDATE |
| docs/guides/*.md | KEEP |
| docs/consolidation-plan.md | UPDATE |
| docs/backlog/*.md | KEEP / UPDATE |
| docs/api/*.md | KEEP / UPDATE (OpenAPI path) |
| docs/ops/*.md | KEEP |
| docs/observability/*.md | KEEP / UPDATE / MERGE (see merge log) |
| docs/security/*.md | KEEP |
| docs/specs/*.md | KEEP |
| docs/release/*.md | KEEP (dated one-offs deleted) |
| docs/audits/*.md | KEEP |
| docs/frontend/**/*.md | KEEP / UPDATE |
| docs/codebase-map.md | KEEP (SYSTEM_MAP merged in) |
| docs/design-system/ORBITAL_GRADE.md | MERGE → frontend/design/design-system.md |
| docs/BASELINE.md, ROADMAP.md, etc. | DELETE (see deletion log) |

Full audit tables: see plan at `.cursor/plans/documentation_consolidation_overhaul_*.plan.md` (sections 1.1–1.10).

---

## 2. Deletion Log

| File | Rationale |
|------|-----------|
| docs/ROADMAP.md | Remove roadmap per prompt; use GitHub Projects |
| docs/release/pre-release-review-2026-02-28.md | Dated one-off; content folded into release checklist / runbook |
| docs/release/verification-checklist-2026-02-28.md | Dated one-off |
| docs/release/rollback-plan-2026-02-28.md | Generic rollback steps merged into docs/ops/runbook.md |
| docs/BASELINE.md | Merged into docs/audits/baseline.md |
| docs/MINIAPP_RELEASE_AUDIT.md | One-off release audit |
| docs/observability/diagnostics-upgrade-report.md | One-off report |
| docs/observability/legacy-removal-plan.md | Legacy observability removal done; doc obsolete |
| docs/OPTIMIZATION_SCORECARD.md | Redundant with audits |
| docs/TOP_FINDINGS.md | Merged into docs/observability/top-findings.md |
| docs/SYSTEM_MAP.md | Merged into docs/codebase-map.md |
| docs/FOUNDATIONS_GOVERNANCE.md | Merged into docs/frontend/design/foundations-governance.md |
| docs/TELEMETRY_OBSERVABILITY_DATA_FLOW.md | Merged into docs/observability/current-state.md |
| docs/observability/ARCHITECTURE.md | Merged into docs/observability/current-state.md |
| docs/observability/FOLDER_STRUCTURE.md | Merged into docs/observability/README.md |
| docs/design-system/ORBITAL_GRADE.md | Merged into docs/frontend/design/design-system.md |
| STORYBOOK_AUDIT.md | One-off audit; findings in storybook docs |
| docs/telemetry_audit.md | Moved to docs/audits/telemetry-audit.md (kebab-case) |

---

## 3. Merge Log

| Source | Target |
|--------|--------|
| docs/release/rollback-plan-2026-02-28.md | docs/ops/runbook.md (Rollback and feature-flag mitigations section) |
| docs/BASELINE.md | docs/audits/baseline.md (Baseline measurements section) |
| docs/FOUNDATIONS_GOVERNANCE.md | docs/frontend/design/foundations-governance.md (Source of truth section) |
| docs/TELEMETRY_OBSERVABILITY_DATA_FLOW.md | docs/observability/current-state.md (Telemetry data path + architecture) |
| docs/observability/ARCHITECTURE.md | docs/observability/current-state.md (Architecture section) |
| docs/observability/FOLDER_STRUCTURE.md | docs/observability/README.md (Folder structure section) |
| docs/TOP_FINDINGS.md | docs/observability/top-findings.md (Latency bottlenecks table) |
| docs/SYSTEM_MAP.md | docs/codebase-map.md (Service inventory table) |
| docs/design-system/ORBITAL_GRADE.md | docs/frontend/design/design-system.md (Orbital-grade theme section) |

---

## 4. Documentation Gap Report

Topics that need new or expanded docs (list only; not written in this overhaul):

- **E2E test run from CI:** How to run frontend E2E locally and how CI runs them (workflow, artifacts).
- **Node-agent upgrade procedure:** Step-by-step upgrade of node-agent across a fleet without downtime.
- **Config schema validation:** Authoritative schema for client config (Amnezia/WireGuard) and how validation is run (scripts, CI).
- **OpenAPI release process:** When to regenerate openapi/openapi.yaml, how it’s consumed, and any post-processing.
- **Observability stack bring-up:** Minimal set of env vars and compose profile to get Grafana/Loki/Tempo usable from scratch.
- **RBAC matrix:** Table of roles vs permissions and how to add a new permission.
- **Miniapp deployment:** Build, host, and Telegram Mini App configuration (domain, bot link).
- **Disaster recovery:** Full restore from backups (Postgres + Redis + optional config) and verification steps.
- **Rate limits and quotas:** Per-endpoint or global limits, env vars, and behavior when exceeded.
- **Audit log retention and querying:** Retention policy and how to query audit events (API, examples).
