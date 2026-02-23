# VPN Suite Docs

**Start here:** [README (this file)](#quick-reference) · API: [api/overview.md](api/overview.md) · Ops: [ops/runbook.md](ops/runbook.md) · Release: [ops/release-checklist.md](ops/release-checklist.md)

---

## Quick reference

| Need | Doc |
|------|-----|
| API, auth, endpoints | [api/overview.md](api/overview.md) · OpenAPI: `openapi/openapi.yaml` |
| Domain model | [api/domain-model.md](api/domain-model.md) |
| Secrets / env | [ops/required-secrets.md](ops/required-secrets.md) |
| Runbook (prod, backups, agent) | [ops/runbook.md](ops/runbook.md) |
| Release & quality gates | [ops/release-checklist.md](ops/release-checklist.md) · [ops/quality-gates.md](ops/quality-gates.md) · [security/hardening-checklist.md](security/hardening-checklist.md) |
| Codebase layout | [codebase-map.md](codebase-map.md) |
| Agent mode setup | [ops/agent-mode-one-server.md](ops/agent-mode-one-server.md) |
| DoD / MVP | [backlog/dod-mvp.md](backlog/dod-mvp.md) |

## Specs & design

| Topic | Doc |
|-------|-----|
| Design system | [frontend/design-system.md](frontend/design-system.md) |
| Typography | [frontend/typography-tokens.md](frontend/typography-tokens.md) |
| Control-plane | [specs/ultra-spec-control-plane.md](specs/ultra-spec-control-plane.md) |
| Telemetry | [specs/telemetry-spec.md](specs/telemetry-spec.md) |
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
| API PR roadmap (12 PRs) | [api/audit/06-pr-roadmap.md](api/audit/06-pr-roadmap.md) |
| Hardening (2–4 weeks) | [backlog/execution-roadmap.md](backlog/execution-roadmap.md) |

## Observability (monitoring stack)

| Topic | Doc |
|-------|-----|
| Deploy/debug/rollback | [observability/runbook-observability.md](observability/runbook-observability.md) |
| Validation (targets, queries) | [observability/validation.md](observability/validation.md) |
| Outline+AWG data contract | [observability/data-contract.md](observability/data-contract.md) |

## Audits & security

| Topic | Doc |
|-------|-----|
| Audits (logs, perf, security, UI, release readiness) | [audits/](audits/) |
| Hardening checklist | [security/hardening-action-plan.md](security/hardening-action-plan.md) · [security/hardening-checklist.md](security/hardening-checklist.md) |
| Threat model | [security/threat-model.md](security/threat-model.md) |
| Infrastructure map | [ops/infrastructure-map.md](ops/infrastructure-map.md) |

## Frontend (tables, Storybook, design system)

| Topic | Doc |
|-------|-----|
| Design system, typography, UI guide, component inventory | [frontend/](frontend/) |
| Table guides, QA, migration | [frontend/](frontend/) |
| Storybook | [frontend/storybook/](frontend/storybook/) |

## Ops (runbooks, troubleshooting)

| Topic | Doc |
|-------|-----|
| Runbook, agent mode, Outline, AmneziaWG, no-traffic troubleshooting | [ops/](ops/) |

## Workflow

| Topic | Doc |
|-------|-----|
| Multi-agent workflow (skills, subagents) | [workflow.md](workflow.md) |
| Doc naming conventions | [naming-conventions.md](naming-conventions.md) |

## Other (root)

- [api/reference.md](api/reference.md) — API reference links  
- [audits/analytics.md](audits/analytics.md) — funnel events  
- [audits/baseline.md](audits/baseline.md) — perf baseline capture (admin)  
