---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/008-spec-gaps-action-and-convergence.md
  - vault/01-specs/vpn-suite-tech-spec-updated.md
  - docs/specs/action-orchestration-spec.md
  - docs/specs/reconciliation-spec.md
  - vault/07-docs/specs/action-orchestration-spec.md
  - vault/07-docs/specs/reconciliation-spec.md
depends: []
---

## Goal

Close **§20.1–2** of [[01-specs/vpn-suite-tech-spec-updated]]: formalize **action orchestration** (lifecycle, retries, compensation, operator visibility) and **desired-state convergence** (issue-time guarantees, timeouts, stale desired state, conflict resolution) in the existing spec files. Align prose with **§10–11** of the tech spec (async convergence, action queue).

## Context

- **Layer A vs B** (tech spec §19): mark sections clearly as **as-built** vs **target** where forward-looking.
- Keep **`docs/`** and **`vault/07-docs/`** mirrors **identical** for touched files (copy or dual edit).

## Acceptance criteria

1. Both **`docs/specs/action-orchestration-spec.md`** and **`docs/specs/reconciliation-spec.md`** have measurable sections (headings + bullets) covering the gaps listed in §20.1–2; stale placeholder text removed or marked TODO with issue ref.
2. **Mirrors** under `vault/07-docs/specs/` updated to match `docs/`.
3. Short **changelog** paragraph at top of each file (`## Changelog` or note) with date and summary.
4. Journal + **`task_done`**.

## Constraints

- **Docs + vault mirror only** — no application code unless a follow-up task.
- If scope explodes, split reconciliation vs action into two PRs and update this task note.

## Prompt (copy-paste to agent)

`task_next` → read tech spec + both spec pairs → edit `docs/` then sync `vault/07-docs/` → journal → `task_done`.
