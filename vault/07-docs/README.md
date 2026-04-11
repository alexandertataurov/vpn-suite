# VPN Suite Docs

> **Obsidian mirror:** This file and sibling paths mirror the repository `docs/` tree (same relative paths under `vault/07-docs/`). Canonical copies for edits in-repo remain at `docs/` unless you intentionally maintain the vault. In Obsidian, prefer `[[wikilinks]]` between notes here (e.g. [[07-docs/guides/README]]). **MOC:** [[07-docs/_index]] · **Conventions:** [[01-specs/obsidian-docs-conventions]].

**Start here:** [[07-docs/guides/README|Guides]] (consolidated by role) · [Quick reference](#quick-reference)

Archive policy: active operator/developer docs live in the main tree below. Historical one-off material should be deleted once it no longer serves an active operator or developer workflow.

---

## Consolidated guides (by persona)

| Role | Guide | Contents |
|------|-------|----------|
| **Ops / SRE** | [[07-docs/guides/operations-guide|Operations guide]] | Runbook, infra, agent mode, secrets, troubleshooting |
| **Ops / SRE** | [[07-docs/guides/observability-guide|Observability guide]] | Monitoring stack, metrics, logs, validation |
| **Developer** | [[07-docs/guides/development-guide|Development guide]] | Codebase, API, quality gates, specs |

---

## Quick reference

| Need | Doc |
|------|-----|
| API, auth, endpoints | [[07-docs/api/overview|api/overview.md]] · [[07-docs/api/as-built-api-spec|api/as-built-api-spec.md]] · OpenAPI: `openapi/openapi.yaml` |
| Domain model | [[07-docs/api/domain-model|api/domain-model.md]] · [[07-docs/api/db-schema-spec|api/db-schema-spec.md]] |
| Spec pack | [[07-docs/spec-pack/README|spec-pack/README.md]] |
| Secrets / env | [[07-docs/ops/required-secrets|ops/required-secrets.md]] |
| Runbook (prod, backups, agent) | [[07-docs/ops/runbook|ops/runbook.md]] |
| Supported operating modes | [[07-docs/ops/supported-operating-modes|ops/supported-operating-modes.md]] |
| Release & quality gates | [[07-docs/ops/release-checklist|ops/release-checklist.md]] · [[07-docs/ops/quality-gates|ops/quality-gates.md]] · [[07-docs/security/hardening|security/hardening.md]] |
| Production hardening (Ubuntu LTS reference) | [[07-docs/ops/hardening-reference-ubuntu|ops/hardening-reference-ubuntu.md]] |
| Codebase layout | [[07-docs/codebase-map|codebase-map.md]] |
| Monorepo vs Python apps | [[07-docs/codebase-map#monorepo-boundaries|codebase-map.md — Monorepo boundaries]] |
| Agent mode setup | [[07-docs/ops/agent-mode-one-server|ops/agent-mode-one-server.md]] |
| DoD / MVP | [[07-docs/backlog/dod-mvp|backlog/dod-mvp.md]] |
| Mobile accessibility checklist (WCAG 2.2 A/AA) | [[07-docs/accessibility-checklist|accessibility-checklist.md]] |

## API & development

→ **Consolidated:** [[07-docs/guides/development-guide|guides/development-guide.md]]

## Specs & design

| Topic | Doc |
|-------|-----|
| Design system | [[07-docs/frontend/design/design-system|frontend/design/design-system.md]] |
| Typography | [[07-docs/frontend/design/typography-tokens|frontend/design/typography-tokens.md]] |
| Miniapp design guidelines | [[07-docs/frontend/design/amnezia-miniapp-design-guidelines|frontend/design/amnezia-miniapp-design-guidelines.md]] |
| Specs index | [[07-docs/specs/README|specs/README.md]] |
| As-built + target architecture | [[07-docs/specs/as-built-architecture|specs/as-built-architecture.md]] · [[07-docs/specs/target-architecture|specs/target-architecture.md]] |
| Control-plane | [[07-docs/specs/ultra-spec-control-plane|specs/ultra-spec-control-plane.md]] |
| Orchestration and reconciliation | [[07-docs/specs/action-orchestration-spec|specs/action-orchestration-spec.md]] · [[07-docs/specs/reconciliation-spec|specs/reconciliation-spec.md]] |
| Agent, placement, config delivery | [[07-docs/specs/agent-protocol-spec|specs/agent-protocol-spec.md]] · [[07-docs/specs/placement-failover-spec|specs/placement-failover-spec.md]] · [[07-docs/specs/config-delivery-spec|specs/config-delivery-spec.md]] |
| Telemetry | [[07-docs/specs/telemetry-spec|specs/telemetry-spec.md]] |
| Operator Dashboard | [[07-docs/specs/operator-dashboard-spec|specs/operator-dashboard-spec.md]] |
| Operator UI | [[07-docs/specs/operator-ui-spec|specs/operator-ui-spec.md]] |
| AmneziaWG | [[07-docs/ops/amneziawg-integration|ops/amneziawg-integration.md]] · [[07-docs/ops/amneziawg-obfuscation-runbook|ops/amneziawg-obfuscation-runbook.md]] |
| Config generation contract | [[07-docs/specs/config-generation-contract|specs/config-generation-contract.md]] |

## Bot

| Topic | Doc |
|-------|-----|
| Architecture, logging, keyboards, release | [[07-docs/bot|bot.md]] |
| Release checklist, production plan, menu architecture | [[07-docs/bot/release|bot/release.md]] · [[07-docs/bot/production-plan|bot/production-plan.md]] · [[07-docs/bot/bot-menu-architecture|bot/bot-menu-architecture.md]] |

## Backlog & planning

| Topic | Doc |
|-------|-----|
| **Consolidation & unimplemented tasks** | [[07-docs/consolidation-plan|consolidation-plan.md]] |
| Backlog, PR plan, cleanup, target structure | [[07-docs/backlog/backlog|backlog/backlog.md]] |
| Spec execution program (next 1-2 releases) | [[07-docs/backlog/spec-delivery-program|backlog/spec-delivery-program.md]] |
| API PR roadmap | [[07-docs/backlog/backlog|backlog/backlog.md]] |
| Hardening (2–4 weeks) | [[07-docs/backlog/execution-roadmap|backlog/execution-roadmap.md]] |

## Observability (monitoring stack)

→ **Consolidated:** [[07-docs/guides/observability-guide|guides/observability-guide.md]]

| Topic | Doc |
|-------|-----|
| Current state (services, ports, dataflow) | [[07-docs/observability/current-state|observability/current-state.md]] |
| Deploy/debug/rollback | [[07-docs/observability/runbook-observability|observability/runbook-observability.md]] |
| Validation (targets, queries) | [[07-docs/observability/validation|observability/validation.md]] |
| AWG data contract | [[07-docs/observability/data-contract|observability/data-contract.md]] |

## Product & business

| Topic | Doc |
|-------|-----|
| Business logic, entities, user journeys | [[07-docs/BUSINESS_LOGIC_AND_USER_JOURNEYS|BUSINESS_LOGIC_AND_USER_JOURNEYS.md]] |
| Revenue funnel (trial, payment, retention) | [[07-docs/revenue-engine-funnel|revenue-engine-funnel.md]] |
| Referral pipeline (attach API, capture) | [[07-docs/referral-pipeline|referral-pipeline.md]] |
| Telegram Mini App guidelines | [[07-docs/TELEGRAM-MINIAPP-GUIDELINES|TELEGRAM-MINIAPP-GUIDELINES.md]] |

## Security

| Topic | Doc |
|-------|-----|
| Hardening | [[07-docs/security/hardening|security/hardening.md]] |
| Threat model | [[07-docs/security/threat-model|security/threat-model.md]] |
| Infrastructure map | [[07-docs/ops/infrastructure-map|ops/infrastructure-map.md]] |

## Frontend

| Topic | Doc |
|-------|-----|
| **Index** (apps, routes, design, tables, testing) | [[07-docs/frontend/README|frontend/README.md]] |
| Miniapp app + design-system docs | [[07-docs/frontend/miniapp-app|frontend/miniapp-app.md]] · [[07-docs/frontend/miniapp-design-system-overview|frontend/miniapp-design-system-overview.md]] |
| Admin design-system docs | [[07-docs/frontend/admin-design-system/README|frontend/admin-design-system/README.md]] |
| Design system, typography, UI guide | [frontend/design/](frontend/design/) |
| Admin design tokens | [[07-docs/frontend/design-tokens|frontend/design-tokens.md]] |
| Table guides, QA, migration | [frontend/tables/](frontend/tables/) |
| Storybook | [frontend/storybook/](frontend/storybook/) |
| Performance (Lighthouse, bundle) | [[07-docs/frontend/performance-report|frontend/performance-report.md]] |

## Ops (runbooks, troubleshooting)

→ **Consolidated:** [[07-docs/guides/operations-guide|guides/operations-guide.md]]

| Topic | Doc |
|-------|-----|
| Runbook, agent mode, AmneziaWG, no-traffic troubleshooting | [ops/](ops/) |
| Discovery contract and validation | [[07-docs/ops/discovery-data-contract|ops/discovery-data-contract.md]] · [[07-docs/ops/discovery-validation|ops/discovery-validation.md]] |
| Deploy setup (GitHub Secrets) | [[07-docs/DEPLOY_SETUP|DEPLOY_SETUP.md]] |
| Pre-deploy checklist & smoke test | [[07-docs/ops/pre-deploy-checklist|ops/pre-deploy-checklist.md]] |
| Config not working | [[07-docs/ops/config-not-working-checklist|ops/config-not-working-checklist.md]] |
| Config not found (reissue) | [[07-docs/ops/config-not-found-deep-dive|ops/config-not-found-deep-dive.md]] |
| No traffic (handshake OK) | [[07-docs/ops/no-traffic-troubleshooting|ops/no-traffic-troubleshooting.md]] |
| Telemetry degraded | [[07-docs/ops/telemetry-degraded-troubleshooting|ops/telemetry-degraded-troubleshooting.md]] |
| Miniapp session error | [[07-docs/troubleshooting/miniapp-session-error|troubleshooting/miniapp-session-error.md]] |

## Local development

| Topic | Doc |
|-------|-----|
| Local dev environment (WSL2, Docker, setup) | [[07-docs/ops/local-dev-environment|ops/local-dev-environment.md]] |
| Dev modes (local full-stack / beta API / deployed) | [[07-docs/ops/local-dev-modes|ops/local-dev-modes.md]] |
| Data sync from VPS (dump, restore, sanitize) | [[07-docs/ops/local-first-data-sync|ops/local-first-data-sync.md]] |

## Workflow

| Topic | Doc |
|-------|-----|
| Multi-agent workflow (skills, subagents) | [[07-docs/workflow|workflow.md]] |
| Doc naming conventions | [[07-docs/naming-conventions|naming-conventions.md]] |

## Reference

- [[07-docs/api/reference|api/reference.md]] — API reference links  
- [[07-docs/spec-pack/README|spec-pack/README.md]] — migrated product/spec pack
