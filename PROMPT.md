Prompt:
Use this workflow together: (1) Invoke system-architect-gatekeeper to review the change and produce an architecture note, Go/No-Go decision, and task breakdown by agent. (2) Invoke orchestrator to enforce boundaries, hand off cross-boundary work as TODO + handoff notes, and keep work in small increments with manual test checklists. (3) Invoke frontend-engineer for frontend, backend-engineer for backend, and ci-watcher for CI/tooling in parallel as needed. (4) Invoke observability-engineer to add telemetry, standardize correlation IDs, define SLOs, and produce metrics, log spec, dashboard changes, and a runbook snippet.

Or a shorter version:

Use system-architect-gatekeeper to review and decide, orchestrator to assign work and enforce boundaries, frontend-engineer/backend-engineer/ci-watcher for implementation, and observability-engineer for telemetry and SLOs.
