## Telegram Mini App — Beta Testing & QA Structure

Version: `v0.1-beta-launch`

This document defines **minimal automated coverage** and **manual QA journeys**
for the Telegram mini app beta.

---

### 1. Minimal automated coverage (before beta)

Automated tests do not need to be exhaustive, but they must guard core flows.

**Per-page render tests (unit level)**

- For each beta‑critical route:
  - `/`, `/onboarding`, `/plan`, `/plan/checkout/:planId`, `/devices`, `/devices/issue`,
    `/connect-status`, `/servers`, `/referral`, `/restore-access`, `/settings`, `/support`.
- Expectations:
  - Route renders without runtime error given a valid mocked session.
  - Primary CTA from `MINIAPP_BETA_PRIMARY_CTAS.md` is present and enabled
    when preconditions are met.

**Key integration/smoke tests (Playwright / RTL + mocks)**

- Journey 1 — First-time user:
  - Open app with fresh state → redirect to `/onboarding`.
  - Tap `Choose plan` → `/plan`.
  - Select plan, `Continue to checkout` → `/plan/checkout/:planId`.
  - Complete “payment” (mocked) → redirect to `/devices` or `/connect-status`.
  - Confirm `Add device` path and support fallback.
- Journey 2 — Returning paid user:
  - Open app with active subscription and existing devices.
  - Land on `/` and see correct status and CTA.
  - Navigate to `/devices`, `/settings`, `/support` without errors.
- Journey 3 — Broken session:
  - Simulate expired/broken session at app open.
  - Verify restore path via `/restore-access` works or presents clear failure + support.
- Journey 4 — Empty account:
  - No devices, active plan, no referral activity.
  - Verify empty states on `/devices`, `/referral`, and any related widgets.
- Journey 5 — Error handling:
  - Simulate API failure / slow network on each core page.
  - Verify visible error, retry or support path, and no dead CTAs.

Whenever possible, reuse or extend existing tests in:
- `frontend/miniapp/src/page-models/*.test.tsx`
- `frontend/miniapp/e2e/*.spec.ts`

---

### 2. Manual QA journeys (beta runbook)

For each journey below, QA should tick off the steps and capture notes.

#### Journey 1 — First-time user

1. Launch mini app with no prior session.
2. Confirm:
   - You see `/onboarding` with clear value prop.
   - Only one primary CTA: `Choose plan`.
3. Tap `Choose plan`:
   - Land on `/plan` with visible plans and `Continue to checkout` CTA.
4. Select a plan and continue to checkout:
   - `/plan/checkout/:planId` shows correct plan summary and total.
5. Complete checkout (test/stub flow):
   - After success, you are routed to `/devices` or `/connect-status`.
6. Verify:
   - You see clear setup instructions (no fake “connected” state).
   - Support path is reachable (e.g. `Contact support` or `/support`).

#### Journey 2 — Returning paid user

1. Launch mini app with active subscription and at least one device.
2. Confirm:
   - Landing on `/` shows accurate status and a single primary CTA
     (e.g. `Manage devices`).
3. Navigate:
   - `/devices` — devices list is readable, actions work or are clearly disabled.
   - `/settings` — only real, safe settings are exposed.
   - `/support` — clear primary `Contact support` CTA.

#### Journey 3 — User with broken session

1. Simulate expired/invalid session at app open.
2. Confirm:
   - App shows understandable state (no infinite spinners).
   - You are guided to `/restore-access` when appropriate.
3. On `/restore-access`:
   - `Restore access` CTA works or fails with clear error.
   - `Contact support` path is available if restore fails.

#### Journey 4 — Empty account state

1. Use a state with:
   - Active plan, zero devices.
   - No referral activity.
2. Confirm:
   - `/devices` empty state explains what devices are and how to add one, with `Add device` CTA.
   - `/referral` explains referral status and provides `Copy link`/`Copy code` if enabled.
   - Home and plan pages do not show ghost widgets.

#### Journey 5 — Error handling path

1. For each main page (`/`, `/onboarding`, `/plan`, `/plan/checkout/:planId`,
   `/devices`, `/connect-status`, `/restore-access`, `/servers`, `/support`):
   - Simulate:
     - API failure (5xx / network error).
     - Slow network (artificial delay).
2. Confirm:
   - User sees understandable fallback (InlineAlert or PageStateScreen).
   - Primary CTA does not stay active with no feedback.
   - A retry or support path is visible.

These journeys extend the generic `QA_EXECUTION_CHECKLIST.md` items with
miniapp-specific steps and should be used as the final manual run before beta.

