# Development Guide

Codebase layout, API, quality gates, and release flow.

---

## Quick reference

| Need | Doc / Command |
|------|---------------|
| Codebase structure | [codebase-map.md](../codebase-map.md) |
| API overview | [api/overview.md](../api/overview.md) |
| Domain model | [api/domain-model.md](../api/domain-model.md) |
| Quality gate | `./manage.sh verify` |
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
- **API audit:** [api/audit/API-AUDIT.md](../api/audit/API-AUDIT.md)

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

## 5. Backlog & planning

- [backlog/backlog.md](../backlog/backlog.md)
- [backlog/execution-roadmap.md](../backlog/execution-roadmap.md)
- [consolidation-plan.md](../consolidation-plan.md)
