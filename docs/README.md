# VPN Suite Docs

**Start here:** [Guides](guides/README.md) (consolidated by role) · [Quick reference](#quick-reference)

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
| API, auth, endpoints | [api/overview.md](api/overview.md) · OpenAPI: `openapi/openapi.yaml` |
| Domain model | [api/domain-model.md](api/domain-model.md) |
| Secrets / env | [ops/required-secrets.md](ops/required-secrets.md) |
| Runbook (prod, backups, agent) | [ops/runbook.md](ops/runbook.md) |
| Release & quality gates | [ops/release-checklist.md](ops/release-checklist.md) · [ops/quality-gates.md](ops/quality-gates.md) · [security/hardening.md](security/hardening.md) |
| Codebase layout | [codebase-map.md](codebase-map.md) |
| Agent mode setup | [ops/agent-mode-one-server.md](ops/agent-mode-one-server.md) |
| DoD / MVP | [backlog/dod-mvp.md](backlog/dod-mvp.md) |

## API & development

→ **Consolidated:** [guides/development-guide.md](guides/development-guide.md)

## Specs & design

| Topic | Doc |
|-------|-----|
| Design system | [frontend/design/design-system.md](frontend/design/design-system.md) |
| Typography | [frontend/design/typography-tokens.md](frontend/design/typography-tokens.md) |
| Specs index | [specs/README.md](specs/README.md) |
| Control-plane | [specs/ultra-spec-control-plane.md](specs/ultra-spec-control-plane.md) |
| Telemetry | [specs/telemetry-spec.md](specs/telemetry-spec.md) |
| Operator Dashboard | [specs/operator-dashboard-spec.md](specs/operator-dashboard-spec.md) |
| Operator UI | [specs/operator-ui-spec.md](specs/operator-ui-spec.md) |
| AmneziaWG | [ops/amneziawg-integration.md](ops/amneziawg-integration.md) · [ops/amneziawg-obfuscation-runbook.md](ops/amneziawg-obfuscation-runbook.md) |
| Config generation contract | [specs/config-generation-contract.md](specs/config-generation-contract.md) |

## Bot

| Topic | Doc |
|-------|-----|
| Architecture, logging, keyboards, release | [bot.md](bot.md) |

## Backlog & planning

| Topic | Doc |
|-------|-----|
| **Consolidation & unimplemented tasks** | [consolidation-plan.md](consolidation-plan.md) |
| Backlog, PR plan, cleanup, target structure | [backlog/backlog.md](backlog/backlog.md) |
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

## Audits & security

| Topic | Doc |
|-------|-----|
| Audits (logs, perf, security, UI, release readiness) | [audits/](audits/) |
| Hardening | [security/hardening.md](security/hardening.md) |
| Threat model | [security/threat-model.md](security/threat-model.md) |
| Infrastructure map | [ops/infrastructure-map.md](ops/infrastructure-map.md) |

## Frontend

| Topic | Doc |
|-------|-----|
| **Index** (apps, routes, design, tables, testing) | [frontend/README.md](frontend/README.md) |
| Design system, typography, UI guide | [frontend/design/](frontend/design/) |
| Table guides, QA, migration | [frontend/tables/](frontend/tables/) |
| Storybook | [frontend/storybook/](frontend/storybook/) |

## Ops (runbooks, troubleshooting)

→ **Consolidated:** [guides/operations-guide.md](guides/operations-guide.md)

| Topic | Doc |
|-------|-----|
| Runbook, agent mode, AmneziaWG, no-traffic troubleshooting | [ops/](ops/) |

## Workflow

| Topic | Doc |
|-------|-----|
| Multi-agent workflow (skills, subagents) | [workflow.md](workflow.md) |
| Doc naming conventions | [naming-conventions.md](naming-conventions.md) |

## Other (root)

- [api/reference.md](api/reference.md) — API reference links  
- [audits/analytics.md](audits/analytics.md) — funnel events  
- [audits/baseline.md](audits/baseline.md) — perf baseline capture (admin)  
