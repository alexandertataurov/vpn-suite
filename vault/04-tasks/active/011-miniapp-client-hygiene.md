---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/011-miniapp-client-hygiene.md
  - vault/01-specs/miniapp-review-checklist.md
  - apps/miniapp/src/main.tsx
depends: []
---

## Goal

**Miniapp client hygiene:** eliminate **production-path `console.log`** in `apps/miniapp/src/main.tsx` (animation bypass block). Prefer **no console output** in shipped bundles, or gate behind `import.meta.env.DEV` only without changing UX.

## Context

- Review: [[01-specs/miniapp-review-checklist]].
- **Task 006** covers `OnboardingPage` / `BillingPage` / `getUpgradeOfferForIntent` — do **not** duplicate 006 scope here; this task is **`main.tsx` only**.

## Acceptance criteria

1. **`main.tsx`:** No `console.log` in paths that run in production build (or document why dev-only is guaranteed).
2. **`pnpm exec eslint`** on `apps/miniapp/src/main.tsx` clean.
3. Update checklist **§Todos** in [[01-specs/miniapp-review-checklist]] (check off item or note deferral).
4. Journal `vault/05-journal/YYYY-MM-DD-miniapp-client-hygiene.md` + **`task_done`**.

## Constraints

- **Frontend-only**; single file unless `files[]` amended.

## Prompt (copy-paste to agent)

`task_next` → if 006 incomplete, finish or adjust `depends` → read `files[]` → edit `main.tsx` → checklist → journal → `task_done`.
