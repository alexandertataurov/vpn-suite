# Development Guide

Codebase layout, API, quality gates, and release flow.

---

## Quick reference

| Need | Doc / Command |
|------|---------------|
| Codebase structure | [[07-docs/codebase-map|codebase-map.md]] |
| API overview | [[07-docs/api/overview|api/overview.md]] |
| Domain model | [[07-docs/api/domain-model|api/domain-model.md]] |
| Spec pack | [[07-docs/spec-pack/README|spec-pack/README.md]] |
| Quality gate | `./manage.sh verify` |
| Docs validation | `./manage.sh docs-check` |
| Full smoke | `./manage.sh smoke-staging` |

---

## 1. Codebase map

→ [[07-docs/codebase-map|codebase-map.md]]

- Root: manage.sh, docker-compose, .env
- Backend: routers, core, services, models
- Frontend: admin, miniapp, shared
- Bot, node-agent, monitoring

---

## 2. API

- **Overview & endpoints:** [[07-docs/api/overview|api/overview.md]]
- **Domain model:** [[07-docs/api/domain-model|api/domain-model.md]]
- **OpenAPI:** `./manage.sh openapi` → `openapi/openapi.yaml`
- **API consistency backlog:** [[07-docs/api/inconsistencies|api/inconsistencies.md]]

---

## 3. Quality gates & release

- **One-command verify:** `./manage.sh verify`
- **Merge gates:** [[07-docs/ops/quality-gates|ops/quality-gates.md]]
- **Release checklist:** [[07-docs/ops/release-checklist|ops/release-checklist.md]]

---

## 4. Specs

| Topic | Doc |
|-------|-----|
| Control-plane | [[07-docs/specs/ultra-spec-control-plane|specs/ultra-spec-control-plane.md]] |
| Telemetry | [[07-docs/specs/telemetry-spec|specs/telemetry-spec.md]] |
| Config generation | [[07-docs/specs/config-generation-contract|specs/config-generation-contract.md]] |
| Operator UI | [[07-docs/specs/operator-ui-spec|specs/operator-ui-spec.md]] |
| Operator Dashboard | [[07-docs/specs/operator-dashboard-spec|specs/operator-dashboard-spec.md]] |

---

## 5. Local development

- [[07-docs/ops/local-dev-environment|ops/local-dev-environment.md]] — setup (WSL2, Docker, Node, Python)
- [[07-docs/ops/local-dev-modes|ops/local-dev-modes.md]] — full-stack vs beta API vs deployed
- [[07-docs/ops/local-first-data-sync|ops/local-first-data-sync.md]] — data sync from VPS
- [[07-docs/ops/pre-deploy-checklist|ops/pre-deploy-checklist.md]] — pre-commit, smoke, UI test plan

## 6. Backlog & planning

- [[07-docs/backlog/backlog|backlog/backlog.md]]
- [[07-docs/backlog/execution-roadmap|backlog/execution-roadmap.md]]
- [[07-docs/consolidation-plan|consolidation-plan.md]]
