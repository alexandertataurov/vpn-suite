# Multi-Agent Workflow (Cursor / Codex)

Extracted from [PROMPT.md](../PROMPT.md) for discoverability. Use this workflow for non-trivial changes. Keep in sync with PROMPT.md.

## 1. Skills to apply

| Skill | Use for |
|-------|---------|
| team-contract | Single owner per change, small deployable increments, manual test checklist + rollback note, cross-boundary = TODO only |
| system-architect | Before large changes—RFC, Go/No-Go, rollback/observability/API plans, task breakdown |
| observability-engineer | Telemetry—metrics, logs, correlation IDs, SLOs, runbook snippets |
| vpn-suite | Project layout, services, conventions |
| frontend-engineer | UI and frontend work |

## 2. Subagents to invoke

| Subagent | Use for |
|----------|---------|
| system-architect-gatekeeper | Review and architecture note before non-trivial or cross-boundary changes |
| orchestrator | Classify scope, enforce boundaries, create handoff notes for cross-boundary work |
| frontend-engineer | Frontend-only changes |
| backend-engineer | Backend-only changes |
| ci-watcher | CI/tooling changes |
| observability-engineer | Metrics, logs, dashboards, alerts |

## 3. Execution order

1. **For any change:** Apply team-contract first.
2. **For large/cross-boundary changes:** Run system-architect-gatekeeper → orchestrator → implement via domain subagents.
3. **After implementation:** Run observability-engineer for telemetry.
4. **Always:** Keep increments small, with manual test checklist per increment.
