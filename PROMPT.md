# Multi-Agent Workflow Prompt

Use the full multi-agent workflow for this task:

1. Skills to apply
   - team-contract: single owner per change, small deployable increments, manual test checklist + rollback note, cross-boundary = TODO only.
   - system-architect: before large changes—RFC, Go/No-Go, rollback/observability/API plans, task breakdown.
   - observability-engineer: for telemetry—metrics, logs, correlation IDs, SLOs, runbook snippets.
   - vpn-suite: for project layout, services, and conventions.
   - frontend-engineer: for UI and frontend work.

2. Subagents to invoke
   - system-architect-gatekeeper: review and architecture note before non-trivial or cross-boundary changes.
   - orchestrator: classify scope, enforce boundaries, create handoff notes for cross-boundary work.
   - frontend-engineer: frontend-only changes.
   - backend-engineer: backend-only changes.
   - ci-watcher: CI/tooling changes.
   - observability-engineer: metrics, logs, dashboards, alerts.

3. Execution order
   - For any change: apply team-contract first.
   - For large/cross-boundary changes: run system-architect-gatekeeper, then orchestrator, then implement via domain subagents.
   - After implementation: run observability-engineer for telemetry.
   - Keep increments small, with manual test checklist per increment.
