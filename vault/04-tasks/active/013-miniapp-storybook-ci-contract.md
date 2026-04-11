---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/013-miniapp-storybook-ci-contract.md
  - vault/01-specs/storybook-design-consistency-notes.md
  - package.json
  - apps/miniapp/package.json
  - apps/miniapp/.storybook/main.js
  - apps/miniapp/.storybook/preview.tsx
  - apps/miniapp/scripts/check-storybook-contract.mjs
  - apps/miniapp/scripts/check-storybook-page-stories-location.mjs
  - apps/miniapp/scripts/check-storybook-taxonomy.mjs
  - apps/miniapp/scripts/run-storybook-vitest.mjs
  - apps/miniapp/scripts/storybook-contract-config.mjs
depends: []
---

## Goal

Make **`pnpm run storybook:ci:miniapp`** (root) / **`pnpm run storybook:ci`** (in `apps/miniapp`) **green** in CI-like conditions: taxonomy → page-stories → contract → **`build-storybook`** → **Vitest** story tests. Fix or narrow failing checks; document any intentional exclusions in [[01-specs/storybook-design-consistency-notes]] or story metadata.

## Context

- README mentions Storybook 10 metadata quirks; `test-storybook:official:miniapp` may stay non-blocking — this task focuses on the **contract CI** path used for regression gates.
- Do not downgrade addon versions without checking workspace alignment with root `package.json`.

## Acceptance criteria

1. From repo root: `pnpm run storybook:ci:miniapp` exits **0** (or document required env and skip matrix).
2. If stories/config change: **`pnpm --filter miniapp build-storybook`** succeeds.
3. Short note in [[01-specs/storybook-design-consistency-notes]] (what was fixed / deferred).
4. Journal + **`task_done`**.

## Constraints

- **Miniapp + root scripts only** unless admin shared deps require a workspace change — then extend `files[]`.

## Prompt (copy-paste to agent)

`task_next` → read `files[]` → run `pnpm run storybook:ci:miniapp` → fix → notes → journal → `task_done`.
