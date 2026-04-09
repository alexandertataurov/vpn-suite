# Development Guide

Codebase layout, API, quality gates, and release flow.

---

## Quick reference

| Need | Doc / Command |
|------|---------------|
| Codebase structure | [codebase-map.md](../codebase-map.md) |
| API overview | [api/overview.md](../api/overview.md) |
| Domain model | [api/domain-model.md](../api/domain-model.md) |
| Spec pack | [spec-pack/README.md](../spec-pack/README.md) |
| Quality gate | `./manage.sh verify` |
| Docs validation | `./manage.sh docs-check` |
| Full smoke | `./manage.sh smoke-staging` |

---

## 1. Codebase map

→ [codebase-map.md](../codebase-map.md)

- Root: manage.sh, docker-compose, .env
- Backend: routers, core, services, models
- Frontend: admin, miniapp, shared
- Bot, node-agent, monitoring

---

## 2. API

- **Overview & endpoints:** [api/overview.md](../api/overview.md)
- **Domain model:** [api/domain-model.md](../api/domain-model.md)
- **OpenAPI:** `./manage.sh openapi` → `openapi/openapi.yaml`
- **API consistency backlog:** [api/inconsistencies.md](../api/inconsistencies.md)

---

## 3. Quality gates & release

- **One-command verify:** `./manage.sh verify`
- **Merge gates:** [ops/quality-gates.md](../ops/quality-gates.md)
- **Release checklist:** [ops/release-checklist.md](../ops/release-checklist.md)

---

## 4. Specs

| Topic | Doc |
|-------|-----|
| Control-plane | [specs/ultra-spec-control-plane.md](../specs/ultra-spec-control-plane.md) |
| Telemetry | [specs/telemetry-spec.md](../specs/telemetry-spec.md) |
| Config generation | [specs/config-generation-contract.md](../specs/config-generation-contract.md) |
| Operator UI | [specs/operator-ui-spec.md](../specs/operator-ui-spec.md) |
| Operator Dashboard | [specs/operator-dashboard-spec.md](../specs/operator-dashboard-spec.md) |

---

## 5. Local development

- [ops/local-dev-environment.md](../ops/local-dev-environment.md) — setup (WSL2, Docker, Node, Python)
- [ops/local-dev-modes.md](../ops/local-dev-modes.md) — full-stack vs beta API vs deployed
- [ops/local-first-data-sync.md](../ops/local-first-data-sync.md) — data sync from VPS
- [ops/pre-deploy-checklist.md](../ops/pre-deploy-checklist.md) — pre-commit, smoke, UI test plan

## 6. Backlog & planning

- [backlog/backlog.md](../backlog/backlog.md)
- [backlog/execution-roadmap.md](../backlog/execution-roadmap.md)
- [consolidation-plan.md](../consolidation-plan.md)
