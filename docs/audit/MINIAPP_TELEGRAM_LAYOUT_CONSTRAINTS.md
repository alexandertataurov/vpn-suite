## Telegram Mini App — Telegram/Mobile Layout & Back-Button Rules

Version: `v0.1-beta-launch`

Scope: `frontend/miniapp/src/app` (AppShell, SafeAreaLayer, ViewportLayout) and related layouts.

---

### 1. Safe-area rules

- Safe-area handling:
  - All screens are wrapped in `SafeAreaLayer`, which exposes:
    - CSS vars: `--safe-top`, `--safe-bottom`, etc. on `document.documentElement`.
  - Layout CSS (shell/header/main/nav) must respect these vars instead of hard-coded spacing.
- Beta requirements:
  - **Top safe area**:
    - Header (`HeaderZone`) must not overlap Telegram’s top chrome.
    - Page content starts below `--safe-top`.
  - **Bottom safe area**:
    - Bottom nav (`miniapp-bottom-nav`) and sticky CTAs must sit above `--safe-bottom`.
    - No primary button may be fully or partially hidden behind Telegram’s gesture bar.

---

### 2. Viewport layout variants

Two main shells, defined in `ViewportLayout.tsx`:

- `TabbedShellLayout` (home/devices/plan/support/settings):
  - Uses `HeaderZone` (hidden on desktop) + `ScrollZone` + bottom `ActionZone` with tabs.
  - Pull-to-refresh invalidates `webapp` queries; must not trap scroll.
- `StackFlowLayout` (onboarding/checkout/devices-issue/connect-status/restore-access/servers/referral):
  - Uses `HeaderZone` with `stackFlow` + `ScrollZone` + optional reserved space for Telegram main button.
- Beta requirements:
  - `ScrollZone` must always allow:
    - Vertical scroll for long content.
    - Pull-to-refresh gesture without blocking scroll.
  - Content height must be calculated so:
    - No page traps the user (e.g. scrollable child inside non-scrollable parent).

---

### 3. Sticky CTA visibility

- Sticky actions come from:
  - Telegram main button (`MainButtonReserveContext`).
  - Bottom nav in tabbed layout.
- Beta rules:
  - Only one primary sticky CTA per screen:
    - Either Telegram main button **or** an in-page sticky button, not both competing.
  - Primary CTA must remain visible when:
    - Keyboard is open.
    - Page is scrolled to bottom.
  - If keyboard overlaps a CTA on smaller devices, consider:
    - Automatically scrolling the focused input into view.
    - Moving the CTA into Telegram main button when possible.

---

### 4. Modal & overlay constraints

- All blocking overlays must use `OverlayLayer` + `Modal`.
- Modals must:
  - Stay within safe-area bounds.
  - Be vertically scrollable when content exceeds viewport.
  - Not hide destructive or primary buttons behind the keyboard.
- Beta rules:
  - No full-screen fixed overlays without scroll.
  - Confirmation dialogs for destructive actions must be reachable and dismissible
    on small devices in Telegram’s full-screen mode.

---

### 5. Back button behavior contracts

Telegram back behaviors must be predictable:

- **Home/tabbed routes** (`/`, `/devices`, `/plan`, `/support`, `/settings`):
  - Telegram back:
    - Navigates within app history.
    - From root of a tab, may close the mini app (per Telegram default).
- **Stack routes** (`/onboarding`, `/plan/checkout/:planId`, `/devices/issue`, `/connect-status`, `/restore-access`, `/servers`, `/referral`):
  - Telegram back:
    - Steps back in stack to the previous app route.
    - From the first route in stack (e.g. `/onboarding` when entered from app open), may close app.
- Beta rules:
  - For in-progress **checkout** or **restore** flows:
    - If leaving may cause confusion, show a confirmation modal (“You are leaving checkout. Your plan won’t be activated yet.”).
  - Back must never strand user on a blank or partially initialized screen.

---

### 6. Interaction safety (mobile)

- Tap targets:
  - Minimum recommended hit area: 44x44 px.
  - Avoid clusters of destructive actions (e.g. multiple tiny icons in a row).
- Row actions:
  - Use clear affordances (ellipsis/menu or labeled buttons).
  - Destructive actions must require confirmation.
- Keyboard:
  - Forms should scroll so the focused input and primary CTA remain visible.
  - No fixed elements should block error messages near inputs.

This document is the reference for Telegram/mobile-specific layout reviews in beta.

