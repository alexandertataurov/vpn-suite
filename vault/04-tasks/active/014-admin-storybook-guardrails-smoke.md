---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/014-admin-storybook-guardrails-smoke.md
  - vault/01-specs/storybook-design-consistency-notes.md
  - package.json
  - apps/admin-web/package.json
  - apps/admin-web/scripts/storybook-guardrails.mjs
  - apps/admin-web/.storybook/main.ts
  - apps/admin-web/.storybook/preview.tsx
depends: []
---

## Goal

Harden **admin** Storybook quality: ensure **`pnpm --filter admin run storybook:guardrails`** passes and **`pnpm --filter admin run storybook:test`** (or documented equivalent) runs smoke stories without failure. Align with design-system docs expectations (no broken story imports, autodocs where required by project convention).

## Context

- Admin Storybook runs on **port 6006**; test-runner expects a running Storybook unless CI starts it — follow existing `apps/admin-web/package.json` scripts.
- Scope is **admin-web** only; miniapp is task **013**.

## Acceptance criteria

1. `storybook:guardrails` exits **0** after any fixes.
2. Smoke story tests pass per script contract (or CI doc updated with exact command + timeout).
3. Update [[01-specs/storybook-design-consistency-notes]] with admin commands + any caveats.
4. Journal + **`task_done`**.

## Constraints

- Frontend-only; no backend.

## Prompt (copy-paste to agent)

`task_next` → read `files[]` → run guardrails → fix stories/config → optional test-runner → notes → journal → `task_done`.
