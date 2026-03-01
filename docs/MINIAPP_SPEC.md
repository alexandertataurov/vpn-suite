# Telegram Mini App — VPN Product: Design & Architecture Spec

**Version:** 1.0  
**Audience:** Product, Design, Frontend  
**Principles:** Mobile-first, thumb-driven, one primary CTA per screen, progressive disclosure, emotional trust.

---

## 0. UX Principles (Mandatory)

- **A. Mobile-first, thumb-driven:** Primary actions in lower 60% of screen; tap targets ≥44px; no dense tables.
- **B. One primary action per screen:** 1 dominant CTA, 1–2 secondary actions max.
- **C. Progressive disclosure:** Advanced settings (e.g. billing history, security) revealed on demand.
- **D. Emotional trust:** Avoid aggressive colors; stable gradients; emphasize “Secure”, “Protected”, “Connected”; clear status (🟢/🔴).

---

## 0b. Information Architecture & Navigation

- **Main navigation:** Bottom tabs (max 5): **Home** | **Devices** | **Plan** | **Support** | **Settings**.
- **Stack (full-screen, no tabs):** Checkout, Referral, Server selection — entered from Plan/Home/Devices.
- **No nested tab bars;** one level of primary nav.

---

## 1. Complete Screen List

| Screen | Route | Primary CTA | Secondary |
|--------|--------|-------------|-----------|
| **Home** | `/` | Connect Now / Manage Connection | Get config, Change location, Add device |
| **Devices** | `/devices` | Add device | Reissue, Remove (per device) |
| **Plan** | `/plan` | Upgrade / Renew | Billing history, Payment methods |
| **Plans (catalog)** | (from Plan) | Select plan → Checkout | — |
| **Checkout** | `/plan/checkout/:planId` | Pay with Telegram | — |
| **Support** | `/support` | Start Troubleshooter | FAQ, Report problem, Contact |
| **Settings** | `/settings` | — | Language, Notifications, Security, Reset configs |
| **Server selection** | `/servers` | Apply server | — |
| **Referral** | `/referral` | Copy link / Share | — |

**Stack / full-screen (no bottom nav):** Checkout, Referral, Server selection.

---

## 2. Wireframe Descriptions

### Home
- **Header:** App title “VPN” (no badge in prod).
- **Connection status card (hero):**
  - Status row: dot (🟢 Connected / 🔴 Not connected) + label.
  - Location: “Location: Auto” or server name.
  - Primary CTA: “Connect Now” (→ Plan) or “Manage Connection” (→ Devices). Full-width, thumb zone.
- **Subscription summary card:**
  - Plan name, days left, device count / limit. Optional “Best value” / “Expiring soon” chip.
- **Quick actions (vertical list, 1 column):**
  - Get config, Change location, Add device (if subscribed); else “Choose a plan”. Plus Invite friends, Contact support.
- **Trust strip (optional):** Short “Secure · No logs · 99.9% uptime” line or small card.
- **No dense tables; no more than 1–2 secondary actions per block.**

### Plan
- **Page title:** “Plan”, subtitle “Your subscription and upgrade options”.
- **Current plan card:** Plan name, end date, status. Single primary action: “Renew” or “Upgrade”.
- **Upgrade options:** List of plan cards (not table). One card visually highlighted “Best value”. Each: name, duration, price, single “Select” CTA.
- **Collapsible / linked:** Billing history, Payment methods (navigate or expand).

### Devices
- **Page title:** “My devices”, subtitle optional.
- **Add device CTA:** Prominent at top or after short intro.
- **Device list:** Cards only. Each card: device name (or “Device 1”), last active (relative), status (Active / Revoked). Inline: Reissue, Remove. No table.
- **Empty state:** “No devices yet” + “Add device” CTA.

### Support
- **Page title:** “Support”, subtitle “Troubleshooting and help”.
- **Troubleshooter:** Step-by-step (1 → N). One step per card: title, short body, “Next” / “Back”. Final step: “Contact support” + link.
- **FAQ:** Accordion or short cards (Installation, Privacy, Report problem).
- **Contact:** Single “Contact support” link/button.

### Settings
- **Sections:** Language, Notifications, Security (e.g. session info).
- **Danger zone:** “Reset configs” with short explanation and confirm. Single destructive button.

---

## 3. Component List

| Component | Purpose |
|-----------|--------|
| **HomeHeroPanel** | Hero status + location (supersedes ConnectionStatusCard) |
| **SubscriptionSummaryCard** | Plan, days left, devices |
| **PlanCard** | Plan item with “Best value” badge, price, CTA |
| **DeviceCard** | Device name, last active, status, Reissue/Remove |
| **TroubleshooterStep** | Single step: title, body, Next/Back |
| **DangerZone** | Bordered block + title + description + destructive button |
| **ButtonLink** | Primary / secondary / connect style |
| **InlineAlert** | Soft error / warning (retry) |
| **EmptyState** | Icon + message + CTA |
| **ConfirmModal** | Confirm Reissue / Remove / Reset |
| **Skeleton** | Card and list placeholders (no spinners for primary content) |
| **ToastContainer** | Success / error toasts |
| **MiniappLayout** | Shell: header, main, bottom nav |
| **Bottom nav** | 5 tabs: Home, Devices, Plan, Support, Settings |

Shared from `@vpn-suite/shared/ui`: Panel, Button, Skeleton, InlineAlert, Badge, Modal, etc.

---

## 4. Design Tokens (Miniapp)

### Colors (semantic)
- **Background:** `--surface-base` (soft dark default); `--color-bg` for page.
- **Cards:** `--surface-raised`, `--border-subtle`, `--radius-xl` (12–16px).
- **Primary CTA:** `--color-primary` (accent); hover/active from theme.
- **Status:** `--color-success` (secure/connected), `--color-warning` (warning), `--color-error` (problem).

### Spacing
- **Base unit:** 4px. Use `--spacing-2` (8px) to `--spacing-6` (24px) for rhythm.
- **Page padding:** `--spacing-3` (12px) horizontal; main content gap `--spacing-4` (16px).
- **Card padding:** `--spacing-4`–`--spacing-5`.

### Typography
- **Page title:** `--text-2xl`, `font-weight: 650`.
- **Card title / section:** `--text-lg`, `font-weight: 600`.
- **Body:** `--text-base` or `--text-sm`; muted `--color-text-muted`.

### Radius
- **Cards / panels:** `--radius-xl` (12–16px).
- **Buttons / tabs:** `--radius-lg`.

### Motion
- **Duration:** `--duration-fast` (200–300ms).
- **Transitions:** tab switch, button press, modal open/close.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disable transitions.

### Shadows
- **Cards:** `--shadow-sm`, optional subtle inset highlight.
- **Bottom nav:** `border-block-start` + optional soft shadow.

### Safe area
- **Bottom nav:** `padding-bottom: calc(var(--height-bottom-nav) + env(safe-area-inset-bottom))` on layout.

---

## 5. Interaction Rules

- **One primary CTA per screen:** Always one dominant action (Connect, Add device, Select plan, Pay, Start Troubleshooter).
- **Tap targets:** Min height 44px (`--size-touch-target`) for all interactive elements.
- **Primary actions:** In lower 60% of scrollable content where possible.
- **Back button (Telegram):** Handled by WebApp SDK; stack routes (Checkout, Referral, Servers) close or go back via router.
- **Haptics:** Use Telegram WebApp `HapticFeedback` for: primary button tap, success toast, destructive confirm.
- **No full-page reload:** SPA; all navigation via React Router.
- **Errors:** Never raw stack traces; use InlineAlert or fallback screen with “Try again” and optional “Contact support”.

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Telegram WebApp (initData, theme, viewport, safeArea)            │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Client: AuthGuard → getWebappToken() → /webapp/me (session)     │
│  React Query: ["webapp", "me"] → User + subscriptions + devices  │
└───────────────────────────────┬──────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌────────────────┐      ┌─────────────────┐
│  Home         │      │  Plan          │      │  Devices        │
│  session      │      │  session +     │      │  session +      │
│  → status     │      │  /webapp/plans │      │  issue/revoke   │
│  → primary CTA│      │  → checkout    │      │  → list + CRUD   │
└───────────────┘      └────────────────┘      └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend: initData validation, /webapp/me, /webapp/plans,        │
│  /webapp/devices/issue, /webapp/devices/:id/revoke, checkout     │
└─────────────────────────────────────────────────────────────────┘
```

**Data model:**
- **User:** id, plan (from active subscription), expires_at, device_count, location (current server or “Auto”), connection_status (derived: active sub + ≥1 active device).
- **Device:** id, name, last_active, status (active/revoked).

**State:** Central store via React Query (`["webapp", "me"]`); optimistic UI on issue/revoke; rollback on error + toast.

---

## 7. Engagement Mechanics Plan

### A. Visible value signals (on Home / Devices)
- **“Protected for Xh Ym”** — session duration when connected (if backend provides).
- **“Last threat blocked”** — optional; only if product has this metric.
- **“Location: [Server]”** — current exit location.

### B. Smart nudges
- **Plan expiring soon:** Banner on Home/Plan when `daysLeft ≤ 7`: “Your plan ends in X days. Renew to stay protected.”
- **Device limit:** When `device_count >= device_limit - 1`: “Add one more device” or “At device limit” in Devices.
- **Inactive 7 days:** Optional re-engage message in bot or small Home banner (e.g. “We missed you. Stay secure — reconnect.”).

### C. Micro-rewards (optional)
- **Badges:** 30 days active, 3 devices connected, 1 year subscriber. Show as small chips or in Settings/Profile.
- **No gamification overload:** One badge area per screen max; avoid “crypto casino” feel.

---

## 8. Performance Checklist

- [ ] **Initial load < 1.5s:** Lazy routes (Home, Plan, Devices, Support, Settings); minimal sync JS.
- [ ] **Interaction < 150ms:** No heavy work on main thread on tap; debounce only where needed.
- [ ] **No unnecessary re-renders:** React Query for server state; avoid broad context updates.
- [ ] **Lazy load:** Checkout, Referral, ServerSelection loaded on route (already lazy in App).
- [ ] **Cache:** `["webapp", "me"]` cached; invalidate on issue/revoke/checkout success.
- [ ] **Avoid:** Large libs; heavy state manager; big inline SVGs (use sprites or components).

---

## 9. Error Handling Matrix

| Tier | When | UI | Next action |
|------|------|----|-------------|
| **Soft** | Network timeout, 5xx retryable | InlineAlert (warning/error) + “Try again” | Retry same action |
| **Hard** | 4xx (e.g. auth), repeated failure | Fallback screen: “Something went wrong” + “Try again” + “Contact support” | Reopen from Telegram or contact support |
| **Critical** | Invalid session, app broken | Safe reset: clear token + message “Please reopen the app from the bot” | User reopens from bot |

**Rules:**
- Never show raw error messages or stack traces.
- Every error state has a clear explanation and one primary next action.
- Destructive actions (Revoke, Reset) use ConfirmModal with explicit copy.

---

## 10. Telemetry Plan

**Events to track:**

| Event | Properties (optional) |
|-------|------------------------|
| `screen_open` | screen_name, user_plan, build_version |
| `cta_click` | cta_name, screen_name, user_plan |
| `payment_start` | plan_id, user_plan |
| `payment_success` | plan_id, latency_ms |
| `payment_fail` | plan_id, reason (if safe) |
| `config_download` | source (e.g. devices), latency_ms |
| `reissue_action` | device_id (or anonymized) |
| `device_removal` | — |
| `connection_attempt` | from_screen (e.g. home, devices) |

**Include where possible:** `latency_ms`, `user_plan`, `build_version`.  
**Do not log:** PII, tokens, config content.

---

## Telegram Mini App Specifics

- **Back button:** Use Telegram WebApp API; sync with React Router (e.g. pop history or close WebApp on root).
- **Theme:** Sync with Telegram theme (dark/light) via `TelegramThemeBridge`; use CSS variables from tokens.
- **Safe areas:** `env(safe-area-inset-*)` for header and bottom nav.
- **No full reload:** SPA only; deep links open correct route.
- **HapticFeedback:** Use for primary CTA, success, and destructive confirm.
- **Close WebApp:** Only on explicit “Done” or “Close” (e.g. after checkout success); not on every back.
- **initData:** Validate on backend for auth; never trust client-only.

---

## Summary

- **Screens:** Home, Devices, Plan, Support, Settings (+ Checkout, Referral, Servers as stack).
- **UI:** Soft dark default, rounded cards, one primary CTA, skeleton loaders, status colors (green/yellow/red).
- **State:** Session from `/webapp/me`; optimistic updates with rollback.
- **Engagement:** Value signals, nudges (expiry, device limit), optional badges.
- **Performance:** Lazy routes, cache, <1.5s load, <150ms interaction.
- **Errors:** 3 tiers (soft / hard / critical) with clear copy and next action.
- **Telemetry:** Screen, CTA, payment, config, device actions; include latency and plan where possible.
