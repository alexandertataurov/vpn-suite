---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/012-miniapp-e2e-connect-status.md
  - vault/01-specs/miniapp-review-checklist.md
  - apps/miniapp/e2e/connect-status.spec.ts
  - apps/miniapp/e2e/helpers/miniapp.ts
  - apps/miniapp/src/features/connect-status/ConnectStatusPage.tsx
depends: []
---

## Goal

Add a **Playwright smoke test** for route **`/connect-status`** so the Connect Status page is covered explicitly (today: page + model exist; e2e matrix in [[01-specs/miniapp-review-checklist]] flags a gap).

## Context

- Follow patterns in `apps/miniapp/e2e/home.spec.ts` / `business-flows.spec.ts` (`injectTelegram`, `setupMiniappApi`, `gotoMiniapp`).
- Session/fixtures must satisfy `useConnectStatusPageModel` / `SessionMissing` branches as appropriate — assert at least one stable heading or card visible for a “happy path” session.

## Acceptance criteria

1. **`apps/miniapp/e2e/connect-status.spec.ts`** exists with ≥1 test; `pnpm --filter miniapp exec playwright test e2e/connect-status.spec.ts` passes (or full e2e suite if project convention requires).
2. Checklist [[01-specs/miniapp-review-checklist]] updated (e2e gap row / todos).
3. Journal + **`task_done`**.

## Constraints

- **E2E + vault checklist only** unless `files[]` extended for production code fixes.

## Prompt (copy-paste to agent)

`task_next` → read helpers + ConnectStatusPage + model hooks → write spec → run playwright → checklist → journal → `task_done`.
