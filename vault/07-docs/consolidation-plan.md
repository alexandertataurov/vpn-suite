# Documentation Consolidation & Unimplemented Tasks Plan

**Created:** 2026-02-23  
**Updated:** 2026-03 (doc overhaul: ROADMAP/BASELINE/dated release docs removed; FOUNDATIONS_GOVERNANCE, TELEMETRY_OBSERVABILITY_DATA_FLOW, SYSTEM_MAP, observability ARCHITECTURE/FOLDER_STRUCTURE/legacy-removal merged; OpenAPI path unified to openapi/openapi.yaml)
**Purpose:** Single place for doc structure, consolidation, and unimplemented work.

---

## 0. Consolidated guides (2026-02-24)

**Added:** `docs/guides/` — single entry points by persona.

| Guide | Path | Audience |
|-------|------|----------|
| Operations | [[07-docs/guides/operations-guide|guides/operations-guide.md]] | Ops, SRE |
| Observability | [[07-docs/guides/observability-guide|guides/observability-guide.md]] | Ops, SRE |
| Development | [[07-docs/guides/development-guide|guides/development-guide.md]] | Developers |

Master index: [[07-docs/README|docs/README.md]] — links to guides + full doc tree.

---

## 1. Current Documentation Map

### 1.1 Root (14 files) — DONE
| File | Topic | Action (done) |
|------|-------|--------|
| PROMPT.md | Multi-agent workflow | **Keep** (Cursor prompt) |
| README.md | Quick start | **Keep** |
| AGENTS.md | Codex/agent instructions | **Keep** |
| CHANGELOG.md | Version history | **Keep** |
| RUNBOOK.md | Observability runbook | → docs/observability/runbook-observability.md |
| VALIDATION.md | Observability validation | → docs/observability/validation.md |
| DATA_CONTRACT.md | AWG data contract | → docs/observability/data-contract.md |
| BASELINE.md | Runtime snapshot | → docs/audits/baseline-capture-2026-02-22.md |
| SERVER_LOGS_REPORT.md | Audit | → docs/audits/SERVER_LOGS_REPORT.md |
| PERFORMANCE_BOTTLENECK_REPORT.md | Audit | → docs/audits/PERFORMANCE_BOTTLENECK_REPORT.md |
| SECURITY_RISK_REPORT.md | Audit | → docs/audits/SECURITY_RISK_REPORT.md |
| HARDENING_ACTION_PLAN.md | Security | → docs/security/hardening.md (done) |
| THREAT_MODEL.md | Security | → docs/security/threat-model.md (done) |
| INFRASTRUCTURE_MAP.md | Ops | → docs/ops/infrastructure-map.md |
| TABLE_*.md, MIGRATION_PLAN.md, ARCH_TABLE_SYSTEM.md | UI | → docs/frontend/ |

### 1.2 docs/ (primary)
- README.md — index
- observability/ (10 files)
- Specs, guides, runbooks, checklists — **keep structure**

### 1.3 legacy frontend/shared/docs/ (~35 files, historical reference)
- Design system, Storybook, component audits, migration plans
- **Action:** Completed via consolidation into `docs/frontend/`; do not recreate `frontend/shared/docs/`

### 1.4 infra/discovery/runtime/
- DATA_CONTRACT.md — discovery inventory contract
- VALIDATION.md — discovery validation
- **Action:** Keep (discovery-specific); rename if needed to avoid confusion with root DATA_CONTRACT

### 1.5 .cursor/ (skills, agents)
- **Keep** — Cursor-specific, not product docs

---

## 2. Proposed Consolidated Structure

```
docs/
├── README.md                 # Index (updated)
├── CONSOLIDATION_PLAN.md     # This file
├── api/                      # API reference, audit
│   ├── overview.md → api-overview.md
│   └── api-audit/            # 01-06
├── ops/                      # Operations
│   ├── RUNBOOK.md
│   ├── release-checklist.md
│   ├── docker-ops.md
│   ├── NETWORK_SEGMENTATION_MAP.md
│   └── INFRASTRUCTURE_MAP.md (moved)
├── observability/
│   ├── runbook-observability.md (moved from root RUNBOOK.md)
│   ├── validation.md (moved from root VALIDATION.md)
│   ├── data-contract.md (moved from root DATA_CONTRACT.md)
│   └── ... (existing)
├── security/
│   ├── hardening.md
│   ├── threat-model.md
│   ├── incident-response-runbook.md
│   ├── red-team-simulation-plan.md
│   └── alert-policy.md
├── frontend/                 # Design system links + moved table docs
│   └── (TABLE_*.md, MIGRATION_PLAN.md, etc.)
├── audits/                   # One-off reports
│   ├── SERVER_LOGS_REPORT.md
│   ├── PERFORMANCE_BOTTLENECK_REPORT.md
│   └── SECURITY_RISK_REPORT.md
├── backlog/
│   ├── BACKLOG.md
│   ├── EXECUTION_ROADMAP.md
│   └── api-audit/06-PR-ROADMAP.md
└── specs/                    # Major specs (OPERATOR_*, etc.)
```

---

## 3. Consolidated Unimplemented Tasks

### 3.1 API (from api-audit/06-PR-ROADMAP.md)
| ID | Task | Priority | Owner |
|----|------|----------|-------|
| API-1 | Centralize error envelope + pagination (PR1) | P1 | Backend |
| API-2 | Cap devices list limit to 200 (PR2) | P0 | Backend |
| API-3 | Webhook provider auth hardening (PR3) | P0 | Backend |
| API-4 | Request ID + structured logging (PR4) | P2 | Backend |
| API-5 | Pagination schema unification (PR5) | P2 | Backend |
| API-6 | Fix users list phone filter count (PR6) | P1 | Backend |
| API-7 | Webhook 409 unified error shape (PR7) | P2 | Backend |
| API-8 | Peers list response schema (PR8) | P2 | Backend |
| API-9 | Add contract tests (PR9) | P2 | QA |
| API-10 | Trace ID propagation (PR10) | P2 | Observability |
| API-11 | Bot reset_device scoping verification (PR11) | P0 | Backend |
| API-12 | Agent heartbeat validation (PR12) | P1 | Backend |

### 3.2 Security & Hardening (from HARDENING_ACTION_PLAN, EXECUTION_ROADMAP)
| ID | Task | Priority | Owner |
|----|------|----------|-------|
| SEC-1 | fail2ban for sshd | P1 | Ops |
| SEC-2 | SSH key-only; disable root password | P1 | Ops |
| SEC-3 | Refresh token rotation on use (backend) | P1 | Backend (done) |
| SEC-4 | Refresh token invalidation on logout | P1 | Backend (done) |
| SEC-5 | JWT blacklist / Redis revocation | P2 | Backend |
| SEC-6 | Encrypted backups (pg_dump + gpg) | P1 | Ops |
| SEC-7 | Key rotation policy document | P2 | Ops |
| SEC-8 | Red Team simulation | P2 | Security |
| SEC-9 | Node-agent docker socket :ro — blocked (needs exec) | N/A | — |

### 3.3 Control-Plane Gaps (from BACKLOG, ADMIN_UI_GAP_ANALYSIS)
| ID | Task | Priority | Owner |
|----|------|----------|-------|
| CP-1 | GET /servers/{id}/jobs | P2 | Backend |
| CP-2 | POST restart/reload | P2 | Backend |
| CP-3 | GET diagnostics | P2 | Backend |
| CP-4 | Adapter restart/reload/fetch_logs/snapshot | P2 | Backend |
| CP-5 | Leader lock, circuit breaker | P2 | Backend |
| CP-6 | Single-flight manual sync | P2 | Backend |
| CP-7 | Select: async/search, empty/loading state | P2 | Frontend |
| CP-8 | SearchInput: fix string concat, duplicates | P2 | Frontend |

### 3.4 Release & Cleanup (from BACKLOG)
| ID | Task | Priority | Owner |
|----|------|----------|-------|
| RL-1 | PR-06+: Payments rollback runbook | P2 | Ops |
| RL-2 | Legacy cleanup wave 1 | P2 | All |
| RL-3 | Runtime surface capture | P2 | Ops |
| RL-4 | Target structure: /apps, /packages, /infra | P3 | All |

### 3.5 Open Risks (from RELEASE_READINESS_REPORT)
| Risk | Mitigation |
|------|-------------|
| Control-plane 500 in some envs | Run migrations; check admin role `cluster:read`; review logs |
| Docker telemetry 404 via Caddy | BASE_URL=127.0.0.1:8000 for API smoke; Caddy proxies /api/* |
| Caddy healthcheck 308 | Verify Caddy config for localhost |
| Frontend typecheck env | Ensure pnpm install + TS libs before typecheck |

### 3.6 Deferred
- Supervised model pipeline for anomaly detection
- Big-bang doc migration (do incrementally)

---

## 4. Execution Order (Recommended)

1. **Immediate:** API-2, API-3, API-11 (security)
2. **Week 1:** Doc consolidation — move root docs to docs/ (small PRs)
3. **Week 2:** API-1, API-4, API-6 (quick wins)
4. **Parallel:** SEC-1, SEC-2, SEC-6 (ops hardening)
5. **Next:** API-5, API-7, API-8 (refactor); SEC-3, SEC-4 (auth)
6. **Later:** CP-*, RL-*, frontend primitives

---

## 5. TODO / FIXME in Codebase

- **None found** in source (ts/tsx/py). Only workflow references in PROMPT.md and .cursor/agents.

---

## 6. References

- docs/README.md — docs index
- docs/backlog/backlog.md — backlog
- docs/backlog/execution-roadmap.md — 4-week hardening
- docs/frontend/audits/admin-ui-gap-analysis.md — UI gaps
- docs/security/hardening.md — security checklist
- docs/audits/release-readiness-report.md — scores, open risks
