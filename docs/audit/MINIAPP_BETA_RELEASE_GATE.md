## Telegram Mini App — Beta Release Gate & Issue Labels

Version: `v0.1-beta-launch`

This document instantiates the **final beta gate** and **issue labeling protocol**
for the Telegram mini app.

---

### 1. Final beta release gate (checklist)

Beta can ship only if **all** items below are checked for the current build:

- [ ] Core flows work end-to-end for:
  - First-time user
  - Returning paid user
  - Broken session → restore path
  - Empty account state
  - Error handling path
- [ ] No ship-blocking console/runtime crashes in main paths.
- [ ] No dead primary CTAs (every primary button works or is disabled with reason).
- [ ] No fake or misleading state labels (no unverifiable “connected/protected/success”).
- [ ] No exposed mock/stub UI pretending to be real.
- [ ] Main pages are visually coherent (headers, cards, spacing, typography).
- [ ] Loading / empty / error states exist for main pages.
- [ ] Terminology is unified across the app (see `MINIAPP_BETA_COPY_AND_TERMINOLOGY.md`).
- [ ] Unfinished features are hidden or clearly disabled.
- [ ] Support path is visible and usable from all broken/empty states.
- [ ] Error tracking / telemetry is enabled and key events are emitted
      (see `MINIAPP_BETA_TELEMETRY_CHECKLIST.md`).
- [ ] Mobile + Telegram safe-area pass completed
      (see `MINIAPP_TELEGRAM_LAYOUT_CONSTRAINTS.md`).
- [ ] Manual smoke test across the 5 journeys completed
      (see `MINIAPP_BETA_QA_STRUCTURE.md`).

Beta must **not** ship if **any** of the following are true:

- [ ] Users can get trapped in a broken state with no visible escape.
- [ ] App claims a status it cannot verify (e.g. “connected” without evidence).
- [ ] Onboarding/setup is materially misleading about how VPN connection works.
- [ ] Checkout/plan flow is unclear, unstable, or may charge user incorrectly.
- [ ] There are known critical blockers without a documented workaround.
- [ ] The app visibly feels like mixed prototypes rather than one product.

When closing the gate for a given beta tag:

- Record:
  - Tag: `v0.1-beta-launch-YYYYMMDD` (or equivalent).
  - Checked-by: `name @ role`.
  - Date/time in UTC.

---

### 2. Issue labeling protocol (beta)

All mini app issues related to beta should carry exactly **one** primary label
from the list below, plus any secondary labels as needed (area, component, etc.).

**`beta:blocker`**

- Definition:
  - Prevents core flows from completing.
  - Materially misleads users (e.g. false “connected” state, wrong pricing).
  - Causes crashes or hard errors on main pages.
- Examples:
  - Plan/checkout flow fails silently.
  - Session restore loop strands users.
  - Onboarding CTA does nothing.

**`beta:consistency`**

- Definition:
  - UI/wording inconsistencies that harm trust but do not fully block flows.
- Examples:
  - Header/card spacing drift.
  - Mixed terminology: “plan” vs “subscription” used interchangeably on same page.
  - Inconsistent empty/error states where standard primitives exist.

**`beta:hide-before-release`**

- Definition:
  - Features or UI that are not ready for beta but are currently surfaced.
- Examples:
  - Half-built screens.
  - Stub analytics or settings toggles with no effect.
  - Controls that route to dead ends.

**`beta:copy`**

- Definition:
  - Copy changes needed to align with glossary and CTA map.
- Examples:
  - Vague CTAs (`Continue`, `Submit`) where specific labels are required.
  - Confusing or contradictory explanatory text.

**`beta:mobile`**

- Definition:
  - Mobile layout/safe-area/keyboard issues specific to phone environments.
- Examples:
  - CTAs hidden behind keyboard or Telegram chrome.
  - Modals exceeding usable viewport without scroll.

**`beta:telegram`**

- Definition:
  - Issues specific to Telegram host integration (Mini App APIs, haptics, back behavior).
- Examples:
  - Unpredictable back button behavior.
  - Telegram main button conflicting with in-page CTAs.

**`beta:telemetry`**

- Definition:
  - Missing, incorrect, or misleading telemetry for beta funnels.
- Examples:
  - Missing `checkout_failed` event.
  - Errors that are not logged with enough context.

**`beta:post-beta`**

- Definition:
  - Nice-to-have improvements explicitly out of scope for `v0.1-beta-launch`.
- Examples:
  - Micro-animations.
  - Additional filtering/sorting.
  - Non-critical design refinements.

---

This gate and labeling scheme should be used together with:

- `MINIAPP_BETA_CORE_FLOWS.md`
- `MINIAPP_BETA_PRIMARY_CTAS.md`
- `MINIAPP_DESIGN_SYSTEM_FREEZE.md`
- `MINIAPP_BETA_COPY_AND_TERMINOLOGY.md`
- `MINIAPP_BETA_TELEMETRY_CHECKLIST.md`
- `MINIAPP_TELEGRAM_LAYOUT_CONSTRAINTS.md`
- `MINIAPP_BETA_QA_STRUCTURE.md`

to drive the final beta stabilization sweep.

