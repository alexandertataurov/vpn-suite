## Telegram Mini App — Primary CTA Map (Beta)

Version: `v0.1-beta-launch`

This document defines the **single primary action per screen** for all beta‑critical pages
and when that action is enabled or disabled.

Copy follows the beta copy rules (plain, operational labels only).

---

### 1. Home (`/`)

- **Primary CTA (default)**: `Choose plan`
- **Enabled when**:
  - User has no active subscription, or subscription is inactive/expired.
- **Alternative primary CTA** (when access is already purchased):
  - `Add device` — when user has active subscription and no devices.
  - `Manage devices` — when user has active subscription and existing devices and setup is completed.
- **Target route**:
  - `Choose plan` → `/plan`
  - `Add device` → `/devices/issue`
  - `Manage devices` → `/devices`

Home must never present two equally dominant CTAs at once; context must pick exactly one.

---

### 2. Onboarding (`/onboarding`)

- **Primary CTA**: `Choose plan`
- **Enabled when**:
  - Bootstrap reports first‑time user with no active subscription.
- **Alternative path**:
  - `Go to devices` for users who already have an active subscription.
- **Target route**:
  - `Choose plan` → `/plan`
  - `Go to devices` → `/devices`

Onboarding must not show generic `Continue` — the label must reflect the actual next screen.

---

### 3. Plan (`/plan`)

- **Primary CTA (no subscription)**: `Continue to checkout`
- **Enabled when**:
  - A plan is selected and backend confirms it is purchasable.
- **Primary CTA (active subscription, setup incomplete)**:
  - `Go to devices` or `View setup` (choose one based on the design decision for beta).
- **Primary CTA (active subscription, setup completed)**:
  - `Manage devices` or `Open VPN app` (depending on whether the main action is device management or opening the native app).
- **Target route**:
  - `Continue to checkout` → `/plan/checkout/:planId`
  - `Go to devices` / `Manage devices` → `/devices`
  - `View setup` / `Open VPN app` → `/connect-status` or direct Telegram link to native app.

Only one plan card can be visually emphasized (recommended) at a time; the CTA remains explicit.

---

### 4. Checkout (`/plan/checkout/:planId`)

- **Primary CTA (standard)**: platform‑specific payment action, e.g. `Continue to payment`
- **Enabled when**:
  - Selected plan is valid and payment payload can be created.
  - No in‑flight payment request (duplicate submit protection).
- **Disabled when**:
  - Plan data is still loading.
  - A payment request is in progress.
- **Target route / behavior**:
  - Triggers payment init and then routes according to backend payment status (typically to `/devices` or `/connect-status`).

On error, the same screen must show explicit error text and expose:
- `Retry` (secondary) or
- `Contact support` (secondary, route to `/support`).

---

### 5. ConnectStatus (`/connect-status`)

- **Primary CTA (no devices yet)**: `Add device`
  - Target: `/devices/issue`
- **Primary CTA (devices exist, setup pending)**: `Open VPN app` or `Copy config`
  - Target: external open‑app intent or config copy.
- **Primary CTA (setup completed)**: `Manage devices`
  - Target: `/devices`
- **Fallback CTA (no subscription)**: `Choose plan`
  - Target: `/plan`

The screen must never claim “connected” or “protected” unless backed by a verifiable state;
CTAs must describe actions the miniapp can actually perform.

---

### 6. Devices (`/devices`, `/devices/issue`)

- **Primary CTA (list view)**: `Add device`
  - Enabled when user has an active subscription and has not reached device limit.
  - Target: `/devices/issue`
- **Primary CTA (issue flow)**: `Copy config` or `Open VPN app`
  - Enabled after config is successfully issued.
  - Target: config copy or external app open.

Row‑level destructive actions (revoke/replace) are **secondary** and must include confirmation.

---

### 7. ServerSelection (`/servers`)

- **Primary CTA**: `Select server`
- **Enabled when**:
  - A server/location option is highlighted/selected.
- **Target behavior**:
  - Persist choice via server‑selection API, then route back to previous context (typically `/devices` or `/connect-status`).

Diagnostic metrics (load, latency) are secondary; the CTA stays textual and clear.

---

### 8. Referral (`/referral`)

- **Primary CTA (referrals enabled)**: `Copy link` (or `Copy code`, depending on design)
- **Enabled when**:
  - Referral link/code is available and successfully loaded.
- **Target behavior**:
  - Copies link/code to clipboard and optionally shows lightweight feedback (toast).

If referral mechanics are not fully stable for beta, the page becomes read‑only:
- Primary CTA remains `Copy link` / `Copy code`.
- No attach/claim actions are exposed as primary CTAs.

---

### 9. RestoreAccess (`/restore-access`)

- **Primary CTA**: `Restore access`
- **Enabled when**:
  - Session/restore preconditions are satisfied (e.g. backend reports eligible state).
- **Target behavior**:
  - Calls restore API; on success, routes to the correct next page based on subscription state:
    - No subscription → `/plan`
    - Active subscription, no devices → `/devices/issue`
    - Active subscription, existing devices → `/devices` or `/connect-status`

On failure, an inline error must appear and support path must be visible (`Contact support` to `/support`).

---

### 10. Settings (`/settings`)

- **Primary CTA**: none (Settings is intentionally **non‑CTA‑driven** for beta).
- Allowed primary‑feeling actions:
  - Contextual rows like `Manage devices`, `Change plan`, or `Contact support`, but only one may be visually emphasized if present.
- Destructive actions (e.g. cancel, revoke) must never be the primary CTA on this page and must have confirmation.

Settings must avoid “settings theatre”: no non‑functional toggles exposed as CTAs.

---

### 11. Support (`/support`)

- **Primary CTA**: `Contact support`
- **Enabled when**:
  - At least one support channel is available (link, bot command, email, etc.).
- **Target behavior**:
  - Opens the primary support channel (e.g. Telegram chat, mailto, or external URL).

Secondary CTAs may deep‑link to self‑service flows:
- `Restore access` → `/restore-access`
- `Manage devices` → `/devices`
- `Choose plan` → `/plan`

Support is the universal escape hatch; the primary CTA must always be present and functional.

