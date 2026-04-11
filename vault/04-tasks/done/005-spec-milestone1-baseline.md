---
status: done
agent: cursor
files:
  - vault/04-tasks/active/005-spec-milestone1-baseline.md
  - TODO.md
  - openapi/openapi.yaml
  - apps/admin-api/app/main.py
  - vault/07-docs/specs/as-built-architecture.md
  - vault/07-docs/specs/target-architecture.md
  - vault/07-docs/api/as-built-api-spec.md
  - vault/07-docs/api/db-schema-spec.md
  - vault/07-docs/api/domain-model.md
  - vault/07-docs/ops/supported-operating-modes.md
depends: []
---

## Goal

Execute **Milestone 1 (spec stabilization)** from root [[TODO]]: reconcile **as-built vs target architecture**, **as-built API spec vs live routers/OpenAPI**, and **DB schema spec vs models/migrations** — produce a **gap report** (what matches, what drifts, recommended doc or code follow-ups). Do **not** implement product code unless the report explicitly lists a trivial doc-only fix in scope.

## Context

- Source backlog: `TODO.md` “Milestone 1” bullets; detailed refs in `docs/specs/*`, `docs/api/*`.
- OpenAPI: `openapi/openapi.yaml` (regenerate via `./manage.sh openapi` if comparing to running API).
- Router inventory: `apps/admin-api/app/main.py` imports/applications.

## Acceptance criteria

1. **Vault report note** at `vault/05-journal/YYYY-MM-DD-spec-milestone1-baseline.md` (or `vault/01-specs/spec-gap-report-milestone1.md` if you prefer a durable spec) with YAML `date`, `task`, `files_changed`, and sections: **Architecture**, **API**, **DB**, **Operating modes**, **Prioritized next steps** (max 10 items).
2. Explicit **table or bullet list** of mismatches (e.g. route present in code but missing in as-built spec; model field vs db-schema doc).
3. If OpenAPI is stale vs `main.py`, note whether regen was run and diff summary.
4. **`task_done`** with path `vault/04-tasks/active/005-spec-milestone1-baseline.md` after the report exists.

## Constraints

- Read everything in `files[]` before editing.
- Prefer **read-only** analysis; edits limited to **markdown specs** / **OpenAPI export** if you add those paths to `files[]` in a follow-up edit of this task note.
- Cross-boundary refactors (API + frontend) → handoff note only, no implementation here.

## Prompt (copy-paste to agent)

`task_next` → read `files[]` → compare codebase vs vault mirror docs → write report → `task_done`. Use filesystem-mcp / repo tools; lint only if you touch code.
