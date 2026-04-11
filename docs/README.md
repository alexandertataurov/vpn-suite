# VPN Suite Docs

**Start here:** [Guides](guides/README.md) (consolidated by role) · [Quick reference](#quick-reference)

Archive policy: active operator/developer docs live in the main tree below. Historical one-off material should be deleted once it no longer serves an active operator or developer workflow.

---

## Consolidated guides (by persona)

| Role | Guide | Contents |
|------|-------|----------|
| **Ops / SRE** | [guides/operations-guide.md](guides/operations-guide.md) | Runbook, infra, agent mode, secrets, troubleshooting |
| **Ops / SRE** | [guides/observability-guide.md](guides/observability-guide.md) | Monitoring stack, metrics, logs, validation |
| **Developer** | [guides/development-guide.md](guides/development-guide.md) | Codebase, API, quality gates, specs |

---

## Quick reference

| Need | Doc |
|------|-----|
| API, auth, endpoints | [api/overview.md](api/overview.md) · [api/as-built-api-spec.md](api/as-built-api-spec.md) · OpenAPI: `openapi/openapi.yaml` |
| Domain model | [api/domain-model.md](api/domain-model.md) · [api/db-schema-spec.md](api/db-schema-spec.md) |
| Spec pack | [spec-pack/README.md](spec-pack/README.md) |
| Secrets / env | [ops/required-secrets.md](ops/required-secrets.md) |
| Runbook (prod, backups, agent) | [ops/runbook.md](ops/runbook.md) |
| Supported operating modes | [ops/supported-operating-modes.md](ops/supported-operating-modes.md) |
| Release & quality gates | [ops/release-checklist.md](ops/release-checklist.md) · [ops/quality-gates.md](ops/quality-gates.md) · [security/hardening.md](security/hardening.md) |
| Production hardening (Ubuntu LTS reference) | [ops/hardening-reference-ubuntu.md](ops/hardening-reference-ubuntu.md) |
| Codebase layout | [codebase-map.md](codebase-map.md) |
| Monorepo vs Python apps | [codebase-map.md — Monorepo boundaries](codebase-map.md#monorepo-boundaries) |
| Agent mode setup | [ops/agent-mode-one-server.md](ops/agent-mode-one-server.md) |
| DoD / MVP | [backlog/dod-mvp.md](backlog/dod-mvp.md) |
| Mobile accessibility checklist (WCAG 2.2 A/AA) | [accessibility-checklist.md](accessibility-checklist.md) |

## API & development

→ **Consolidated:** [guides/development-guide.md](guides/development-guide.md)

## Specs & design

| Topic | Doc |
|-------|-----|
| Design system | [frontend/design/design-system.md](frontend/design/design-system.md) |
| Typography | [frontend/design/typography-tokens.md](frontend/design/typography-tokens.md) |
| Miniapp design guidelines | [frontend/design/amnezia-miniapp-design-guidelines.md](frontend/design/amnezia-miniapp-design-guidelines.md) |
| Specs index | [specs/README.md](specs/README.md) |
| As-built + target architecture | [specs/as-built-architecture.md](specs/as-built-architecture.md) · [specs/target-architecture.md](specs/target-architecture.md) |
| Control-plane | [specs/ultra-spec-control-plane.md](specs/ultra-spec-control-plane.md) |
| Orchestration and reconciliation | [specs/action-orchestration-spec.md](specs/action-orchestration-spec.md) · [specs/reconciliation-spec.md](specs/reconciliation-spec.md) |
| Agent, placement, config delivery | [specs/agent-protocol-spec.md](specs/agent-protocol-spec.md) · [specs/placement-failover-spec.md](specs/placement-failover-spec.md) · [specs/config-delivery-spec.md](specs/config-delivery-spec.md) |
| Telemetry | [specs/telemetry-spec.md](specs/telemetry-spec.md) |
| Operator Dashboard | [specs/operator-dashboard-spec.md](specs/operator-dashboard-spec.md) |
| Operator UI | [specs/operator-ui-spec.md](specs/operator-ui-spec.md) |
| AmneziaWG | [ops/amneziawg-integration.md](ops/amneziawg-integration.md) · [ops/amneziawg-obfuscation-runbook.md](ops/amneziawg-obfuscation-runbook.md) |
| Config generation contract | [specs/config-generation-contract.md](specs/config-generation-contract.md) |

## Bot

| Topic | Doc |
|-------|-----|
| Architecture, logging, keyboards, release | [bot.md](bot.md) |
| Release checklist, production plan, menu architecture | [bot/release.md](bot/release.md) · [bot/production-plan.md](bot/production-plan.md) · [bot/bot-menu-architecture.md](bot/bot-menu-architecture.md) |

## Backlog & planning

| Topic | Doc |
|-------|-----|
| **Consolidation & unimplemented tasks** | [consolidation-plan.md](consolidation-plan.md) |
| Backlog, PR plan, cleanup, target structure | [backlog/backlog.md](backlog/backlog.md) |
| Spec execution program (next 1-2 releases) | [backlog/spec-delivery-program.md](backlog/spec-delivery-program.md) |
| API PR roadmap | [backlog/backlog.md](backlog/backlog.md) |
| Hardening (2–4 weeks) | [backlog/execution-roadmap.md](backlog/execution-roadmap.md) |

## Observability (monitoring stack)

→ **Consolidated:** [guides/observability-guide.md](guides/observability-guide.md)

| Topic | Doc |
|-------|-----|
| Current state (services, ports, dataflow) | [observability/current-state.md](observability/current-state.md) |
| Deploy/debug/rollback | [observability/runbook-observability.md](observability/runbook-observability.md) |
| Validation (targets, queries) | [observability/validation.md](observability/validation.md) |
| AWG data contract | [observability/data-contract.md](observability/data-contract.md) |

## Product & business

| Topic | Doc |
|-------|-----|
| Business logic, entities, user journeys | [BUSINESS_LOGIC_AND_USER_JOURNEYS.md](BUSINESS_LOGIC_AND_USER_JOURNEYS.md) |
| Revenue funnel (trial, payment, retention) | [revenue-engine-funnel.md](revenue-engine-funnel.md) |
| Referral pipeline (attach API, capture) | [referral-pipeline.md](referral-pipeline.md) |
| Telegram Mini App guidelines | [TELEGRAM-MINIAPP-GUIDELINES.md](TELEGRAM-MINIAPP-GUIDELINES.md) |

## Security

| Topic | Doc |
|-------|-----|
| Hardening | [security/hardening.md](security/hardening.md) |
| Threat model | [security/threat-model.md](security/threat-model.md) |
| Infrastructure map | [ops/infrastructure-map.md](ops/infrastructure-map.md) |

## Frontend

| Topic | Doc |
|-------|-----|
| **Index** (apps, routes, design, tables, testing) | [frontend/README.md](frontend/README.md) |
| Miniapp app + design-system docs | [frontend/miniapp-app.md](frontend/miniapp-app.md) · [frontend/miniapp-design-system-overview.md](frontend/miniapp-design-system-overview.md) |
| Admin design-system docs | [frontend/admin-design-system/README.md](frontend/admin-design-system/README.md) |
| Design system, typography, UI guide | [frontend/design/](frontend/design/) |
| Admin design tokens | [frontend/design-tokens.md](frontend/design-tokens.md) |
| Table guides, QA, migration | [frontend/tables/](frontend/tables/) |
| Storybook | [frontend/storybook/](frontend/storybook/) |
| Performance (Lighthouse, bundle) | [frontend/performance-report.md](frontend/performance-report.md) |

## Ops (runbooks, troubleshooting)

→ **Consolidated:** [guides/operations-guide.md](guides/operations-guide.md)

| Topic | Doc |
|-------|-----|
| Runbook, agent mode, AmneziaWG, no-traffic troubleshooting | [ops/](ops/) |
| Discovery contract and validation | [ops/discovery-data-contract.md](ops/discovery-data-contract.md) · [ops/discovery-validation.md](ops/discovery-validation.md) |
| Deploy setup (GitHub Secrets) | [DEPLOY_SETUP.md](DEPLOY_SETUP.md) |
| Pre-deploy checklist & smoke test | [ops/pre-deploy-checklist.md](ops/pre-deploy-checklist.md) |
| Config not working | [ops/config-not-working-checklist.md](ops/config-not-working-checklist.md) |
| Config not found (reissue) | [ops/config-not-found-deep-dive.md](ops/config-not-found-deep-dive.md) |
| No traffic (handshake OK) | [ops/no-traffic-troubleshooting.md](ops/no-traffic-troubleshooting.md) |
| Telemetry degraded | [ops/telemetry-degraded-troubleshooting.md](ops/telemetry-degraded-troubleshooting.md) |
| Miniapp session error | [troubleshooting/miniapp-session-error.md](troubleshooting/miniapp-session-error.md) |

## Local development

| Topic | Doc |
|-------|-----|
| Local dev environment (WSL2, Docker, setup) | [ops/local-dev-environment.md](ops/local-dev-environment.md) |
| Dev modes (local full-stack / beta API / deployed) | [ops/local-dev-modes.md](ops/local-dev-modes.md) |
| Data sync from VPS (dump, restore, sanitize) | [ops/local-first-data-sync.md](ops/local-first-data-sync.md) |

## Workflow

| Topic | Doc |
|-------|-----|
| Multi-agent workflow (skills, subagents) | [workflow.md](workflow.md) |
| Doc naming conventions | [naming-conventions.md](naming-conventions.md) |

## Reference

- [api/reference.md](api/reference.md) — API reference links  
- [spec-pack/README.md](spec-pack/README.md) — migrated product/spec pack
