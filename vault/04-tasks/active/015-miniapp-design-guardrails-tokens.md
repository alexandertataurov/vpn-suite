---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/015-miniapp-design-guardrails-tokens.md
  - vault/01-specs/storybook-design-consistency-notes.md
  - apps/miniapp/package.json
  - apps/miniapp/scripts/design-check.sh
  - apps/miniapp/scripts/check-token-drift.mjs
  - apps/miniapp/src/test/design-consistency.test.ts
  - apps/miniapp/src/design-system/core/tokens/__tests__/token-parity.test.ts
depends: []
---

## Goal

Keep **miniapp design consistency** green and documented: **`pnpm --filter miniapp run design:check`**, **`pnpm --filter miniapp run token:drift`**, and unit tests **`design-consistency.test.ts`** + **`token-parity.test.ts`**. Fix drift (tokens, CSS budget contract, recipe locations) or update checks with team-approved exceptions recorded in notes.

## Context

- Root `pnpm run guardrails` maps to miniapp `design:check` — failures block perceived “design consistency.”
- Follow **CONTRIBUTING.md** / design-system rules: no ad-hoc hex in components; use tokens.

## Acceptance criteria

1. `pnpm --filter miniapp run design:check` → **0**
2. `pnpm --filter miniapp run token:drift` → **0**
3. `pnpm --filter miniapp exec vitest run src/test/design-consistency.test.ts src/design-system/core/tokens/__tests__/token-parity.test.ts` → **0** (or full unit suite if preferred)
4. [[01-specs/storybook-design-consistency-notes]] lists these commands and any allowed exceptions.
5. Journal + **`task_done`**.

## Constraints

- **Miniapp-only** token/design files unless `files[]` extended.

## Prompt (copy-paste to agent)

`task_next` → read `files[]` → run design:check + token:drift + targeted vitest → fix → notes → journal → `task_done`.
