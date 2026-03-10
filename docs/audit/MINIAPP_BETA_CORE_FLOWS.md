## Telegram Mini App — Beta Core Flows & State Matrix

Version: `v0.1-beta-launch`

This document specializes the miniapp flow inventory for the **beta release gate** and defines
the state matrix expected for each beta‑critical page.

It is a planning/spec artifact only; implementation is tracked separately in issues.

---

### 1. Routes and entry points (beta‑critical pages)

Source of truth for routes: `frontend/miniapp/src/app/routes.tsx`.

| Page             | Route path                    | Layout shell         | Primary entry points                                      |
| ---------------- | ----------------------------- | -------------------- | --------------------------------------------------------- |
| Home             | `/`                           | `TabbedShellLayout`  | App open, redirects from bootstrap                        |
| Onboarding       | `/onboarding`                 | `StackFlowLayout`    | Bootstrap redirect for first‑time users                   |
| Plan             | `/plan`                       | `TabbedShellLayout`  | Home CTA, Devices/Referral/Support CTAs, redirects        |
| Checkout         | `/plan/checkout/:planId`      | `StackFlowLayout`    | Plan CTA (“Continue to checkout”)                         |
| ConnectStatus    | `/connect-status`             | `StackFlowLayout`    | CTAs from Devices/Onboarding/Restore/Support              |
| Devices (list)   | `/devices`                    | `TabbedShellLayout`  | Home CTA, tab switch, post‑checkout/onboarding redirect   |
| Devices (issue)  | `/devices/issue`              | `StackFlowLayout`    | “Add device” / onboarding completion                      |
| ServerSelection  | `/servers`                    | `StackFlowLayout`    | Devices link, settings shortcut                           |
| Referral         | `/referral`                   | `StackFlowLayout`    | Tab/shell link, settings/home link                        |
| RestoreAccess    | `/restore-access`             | `StackFlowLayout`    | CTAs from Plan/Support, deep links                        |
| Settings         | `/settings`                   | `TabbedShellLayout`  | Tab/shell link from bottom navigation                     |
| Support          | `/support`                    | `TabbedShellLayout`  | Tab/shell link, error/empty state “Contact support” CTAs  |

---

### 2. Global user states for beta

For beta, all pages must behave consistently across these shared states:

- `first_time_user`
- `returning_user`
- `session_expired`
- `no_subscription`
- `active_subscription`
- `pending_setup`
- `setup_completed`
- `no_devices`
- `existing_devices`
- `api_failure`
- `slow_network`
- `referral_available`
- `referral_unavailable`

These flags come from a combination of bootstrap/session, subscription, devices, and referral APIs.
Exact derivation is defined in page‑model specs and backend contracts.

---

### 3. Page × state truth table (high‑level expectations)

This table captures **what each beta‑critical page must show** in core states.
It is intentionally high‑level; details (labels, components) live in per‑page specs.

Legend for CTAs:
- `CTA` column = primary action.
- “Support path” = explicit way to reach `/support`.

#### 3.1 Home (`/`)

| State combo (simplified)                            | Expected summary                                     | Primary CTA             | Notes                                                       |
| --------------------------------------------------- | ---------------------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| first_time_user, no_subscription                    | Explain product + invite to choose plan              | `Choose plan`           | Should route to `/onboarding` or `/plan` per bootstrap     |
| returning_user, no_subscription                     | Show that access is not yet purchased                | `Choose plan`           | No “connected/protected” wording                           |
| active_subscription, no_devices                     | Show access purchased, setup pending                 | `Add device`            | CTA goes to `/devices/issue`                               |
| active_subscription, existing_devices, pending_setup | Explain configs exist but native app not confirmed   | `Open VPN app` or `View setup` | Must not imply live connection control inside miniapp      |
| active_subscription, existing_devices, setup_completed | Positive status with clear next action               | `Manage devices`        | No fake “protected” state; reflect only verifiable facts   |
| session_expired / api_failure                       | Clear error + restore/login guidance                 | `Restore access` or `Contact support` | Support path visible                                   |

#### 3.2 Onboarding (`/onboarding`)

| State combo                         | Expected summary                                          | Primary CTA        | Notes                                                        |
| ---------------------------------- | --------------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| first_time_user, no_subscription   | Simple value prop + explanation of how VPN access works   | `Choose plan`      | Make clear: purchase/setup here, connection in native app    |
| returning_user, active_subscription | Brief confirmation they already have access               | `Go to devices`    | May skip plan step if already subscribed                     |
| api_failure / slow_network         | Minimal error text + retry and support path               | `Retry` / `Contact support` | No broken loading loops                                   |

#### 3.3 Plan (`/plan`)

| State combo                                  | Expected summary                                      | Primary CTA               | Notes                                      |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------- | ------------------------------------------ |
| no_subscription                             | Compare plans, highlight recommended option           | `Continue to checkout`   | One recommended badge at most              |
| active_subscription, pending_setup          | Show current plan + explain that setup is incomplete  | `Go to devices` or `View setup` | Do not push duplicate purchase CTA |
| active_subscription, setup_completed        | Show current plan, renewal info, and management links | `Manage devices` or `Open VPN app` | No misleading “upgrade” by default |
| api_failure / slow_network                  | Fallback copy + support path                          | `Contact support`         | Pricing must not show stale/wrong numbers  |

#### 3.4 Checkout (`/plan/checkout/:planId`)

| State combo                         | Expected summary                                   | Primary CTA              | Notes                                                |
| ---------------------------------- | -------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| no_subscription (selected plan)    | Compact summary of chosen plan and total          | `Continue to payment` or platform‑specific label | Protect against duplicate submission     |
| active_subscription (upgrade path) | Clear explanation of change (upgrade/renew)       | `Confirm upgrade`       | Never silently switch plans                          |
| api_failure / payment init failed  | Explain failure in plain language + retry/help    | `Retry` / `Contact support` | Telemetry must track `checkout_failed`          |

#### 3.5 ConnectStatus (`/connect-status`)

| State combo                                  | Expected summary                                           | Primary CTA            | Notes                                                         |
| ------------------------------------------- | ---------------------------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| active_subscription, no_devices             | Explain that configs are not yet issued                    | `Add device`           | Link to `/devices/issue`                                     |
| active_subscription, existing_devices, pending_setup | Explain that user must finish setup in native app     | `Open VPN app` / `Copy config` | No claims of “connected/protected” in miniapp         |
| active_subscription, existing_devices, setup_completed | Confirm setup is complete and show maintenance actions | `Manage devices` / `Open VPN app` | Status reflects only what backend can verify |
| no_subscription                             | Explain that access is not active                          | `Choose plan`          | Route back to `/plan`                                       |
| api_failure                                 | Show honest error + support path                           | `Contact support`      |                                                               |

#### 3.6 Devices (`/devices`, `/devices/issue`)

| State combo                     | Expected summary                                 | Primary CTA              | Notes                                                     |
| ------------------------------ | ------------------------------------------------ | ------------------------ | --------------------------------------------------------- |
| no_subscription                | Explain devices require an active subscription   | `Choose plan`           | Route to `/plan`                                         |
| active_subscription, no_devices | Explain what devices are and how they appear    | `Add device`            | Empty state guides first issuance                         |
| active_subscription, existing_devices | List devices with clear status per row     | `Add device` or row CTAs | Destructive row actions require confirmation              |
| api_failure                    | Error state with retry + support                 | `Retry` / `Contact support` | No partially rendered rows                            |

#### 3.7 ServerSelection (`/servers`)

| State combo                  | Expected summary                                  | Primary CTA        | Notes                                                  |
| --------------------------- | ------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| active_subscription         | Show available servers/locations and current choice | `Select server`   | Hide fake metrics unless validated                     |
| no_subscription             | Explain that server choice applies after purchase | `Choose plan`      |                                                        |
| api_failure / slow_network  | Error/empty with retry + support                  | `Retry` / `Contact support` | No fake load/fill bars                           |

#### 3.8 Referral (`/referral`)

| State combo                               | Expected summary                                      | Primary CTA           | Notes                                                       |
| ---------------------------------------- | ----------------------------------------------------- | --------------------- | ----------------------------------------------------------- |
| referral_available, active_subscription  | Explain benefit and show copyable link/code          | `Copy link` / `Copy code` | Attach/claim flows must be stable; otherwise keep read‑only |
| referral_unavailable                     | Briefly explain why referrals are not available yet   | `Contact support` (optional) | No dangling “earn rewards” promises                |

#### 3.9 RestoreAccess (`/restore-access`)

| State combo              | Expected summary                                     | Primary CTA        | Notes                                                  |
| ----------------------- | ---------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| session_expired         | Explain that access needs restoring                  | `Restore access`   | Calls restore API and then routes to correct next step |
| active_subscription     | Clarify that access is already active when relevant | `Go to home`       | Avoid conceptual overlap with onboarding               |
| api_failure             | Error message + support path                         | `Contact support`  | No dead‑end failures                                   |

#### 3.10 Settings (`/settings`)

| State combo              | Expected summary                                  | Primary CTA             | Notes                                              |
| ----------------------- | ----------------------------------------------- | ----------------------- | -------------------------------------------------- |
| active_subscription     | Show only safe, real settings                   | Contextual actions only | Destructive actions gated with confirmation        |
| no_subscription         | Minimal account info, link to plan selection    | `Choose plan`           | No settings theatre with non‑functional toggles    |

#### 3.11 Support (`/support`)

| State combo   | Expected summary                                   | Primary CTA        | Notes                                                |
| ------------ | -------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| any state    | Clear description of support options and next step | `Contact support` or deep‑link CTAs | Must always be reachable from failures/empty states |

---

This matrix is the reference for beta audits and issue triage into the A–D buckets
(blockers, consistency, hide/disable, post‑beta).

