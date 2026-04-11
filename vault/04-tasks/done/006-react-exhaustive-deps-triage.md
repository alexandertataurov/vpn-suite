---
status: done
agent: cursor
files:
  - vault/04-tasks/active/006-react-exhaustive-deps-triage.md
  - apps/miniapp/src/features/onboarding/OnboardingPage.tsx
  - apps/miniapp/src/page-models/upsell/getUpgradeOfferForIntent.ts
  - apps/admin-web/src/features/billing/BillingPage.tsx
depends: []
---

## Goal

Remove or **justify** `eslint-disable-line react-hooks/exhaustive-deps` / related suppressions in the three listed files by fixing dependency arrays, splitting effects, or adding a **short comment + eslint-disable-next-line** with rationale (per `.cursor/rules/ai-hardening.mdc`).

## Context

Grep hits (2026-04-11):

- `OnboardingPage.tsx` — `useEffect` with exhaustive-deps disabled
- `BillingPage.tsx` — same
- `getUpgradeOfferForIntent.ts` — unused-vars suppression (verify still needed after any refactor)

## Acceptance criteria

1. Each file: either **no disable** for exhaustive-deps, or **documented exception** (why deps are intentionally omitted).
2. `pnpm exec eslint` on each touched file passes from repo root (or app filter as in package scripts).
3. **Journal** `vault/05-journal/YYYY-MM-DD-react-exhaustive-deps-triage.md` with summary.
4. **`task_done`** `vault/04-tasks/active/006-react-exhaustive-deps-triage.md`.

## Constraints

- **Frontend-only**; no backend changes in this task.
- Do not broaden scope beyond the three files unless you extend `files[]` on this task note first.

## Prompt (copy-paste to agent)

`task_next` → read `files[]` → fix hooks/lint → run eslint on changed files → journal → `task_done`.
