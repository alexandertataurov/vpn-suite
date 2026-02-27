# Production-Grade Design Spec — VPN Telegram Mini App

**Version:** 1.0 | **Status:** Implementation-ready | **Target:** React + Vite

---

## 1. UX Architecture

### 1.1 Screen Hierarchy (max 3 levels)

```
L0 (Bottom Nav)
├── Home (/)
├── Devices (/devices)
├── Plan (/plan)
├── Support (/support)
└── Settings (/settings)

L1 (Stack screens, no bottom nav)
├── Plans (/plan) → Plan (/plan) [redirect/entry]
├── Plan Detail (/plan) [single plan upsell]
├── Checkout (/plan/checkout/:planId)
├── Server Selection (/servers)
├── Referral (/referral)
└── Usage (/usage) [can be tab or link from Home]

L2 (Modals / in-place)
├── Server picker modal (optional, prefer full screen)
├── Confirm revoke device
└── Danger zone confirm
```

### 1.2 User Flows

| Flow | Entry | Path | Exit |
|------|-------|------|------|
| **First-time connect** | Bot deep link | Home → Plan → Plans → Checkout → Home | MainButton: "Pay" on Checkout |
| **Returning user (active)** | Bot / menu | Home → Devices / Servers / Support | MainButton hidden or contextual |
| **Renew / upgrade** | Home ExpiringSoonBanner | Home → Plan → Checkout | MainButton: "Renew" |
| **Add device** | DeviceLimitNudge / Quick action | Home → Devices | MainButton: "Add device" if not at limit |
| **Invite friends** | Quick action | Home → Referral | MainButton: "Copy link" |

### 1.3 Navigation Rules

- **Back:** Use `useTelegramBackButton` on all L1 screens. Back → previous route.
- **MainButton:** Use `useTelegramMainButton` only when there is ONE primary action. Hide on Home, Plan list, Settings.
- **MainButton placement:** Show on Checkout ("Pay"), Referral ("Copy link"), Devices ("Add device" when actionable).
- **Haptics:** `impact("medium")` on primary CTA, `impact("light")` on tab switch, `notification("success")` after copy/payment success.

---

## 2. Design System

### 2.1 Typography

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display` | 28px | 600 | 1.2 | Hero / empty state headline |
| `--text-xl` | 22px | 600 | 1.25 | Page title |
| `--text-lg` | 18px | 600 | 1.3 | Section title |
| `--text-base` | 16px | 500 | 1.4 | Body |
| `--text-sm` | 14px | 400 | 1.4 | Secondary, captions |
| `--text-xs` | 12px | 400 | 1.35 | Labels, badges |

**Font stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif` — system fonts only for perf.

### 2.2 Color System

Integrate with Telegram via `--tg-theme-*`. Map tokens:

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `--color-bg` | `--tg-theme-bg-color` | same | Page background |
| `--color-text` | `--tg-theme-text-color` | same | Primary text |
| `--color-text-muted` | `--tg-theme-hint-color` | same | Secondary |
| `--color-primary` | `#2563eb` | `#60a5fa` | Accent, CTAs |
| `--color-secondary` | `#64748b` | `#94a3b8` | Secondary actions |
| `--color-success` | `#059669` | `#34d399` | Connected, success |
| `--color-warning` | `#d97706` | `#fbbf24` | Expiring, caution |
| `--color-error` | `#dc2626` | `#f87171` | Error, revoked |
| `--color-surface` | `#ffffff` | `#1e293b` | Cards, modals |
| `--color-surface-raised` | `#f8fafc` | `#334155` | Elevated surfaces |
| `--color-border` | `#e2e8f0` | `#475569` | Borders |
| `--color-border-subtle` | `#f1f5f9` | `#334155` | Subtle dividers |

**Surface mapping:** `--surface-base` = `--color-bg`, `--surface-raised` = cards.

### 2.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-1` | 4px | Tight gaps |
| `--spacing-2` | 8px | Inline elements |
| `--spacing-3` | 12px | Card padding, gaps |
| `--spacing-4` | 16px | Section gaps |
| `--spacing-5` | 20px | Card internal |
| `--spacing-6` | 24px | Page header margin |
| `--spacing-8` | 32px | Large sections |

### 2.4 Touch Targets & Layout

- **Min tap area:** 44×44px (`--size-touch-target: 44px`)
- **Bottom nav height:** 64px + safe-area
- **Max content width:** 480px (520px on desktop)
- **Safe areas:** `padding-bottom: env(safe-area-inset-bottom)` on bottom nav and main content

### 2.5 Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Badges, chips |
| `--radius-md` | 12px | Buttons, inputs |
| `--radius-lg` | 16px | Cards |
| `--radius-xl` | 20px | Modals, hero cards |

---

## 3. Component Library

### 3.1 Buttons

| Variant | Background | Border | Text | States |
|---------|------------|--------|------|--------|
| **Primary** | `--color-primary` | none | white | hover: opacity 0.9, active: scale 0.98 |
| **Secondary** | transparent | `--color-border` | `--color-text` | hover: border-primary 30%, active: scale 0.98 |
| **Ghost** | transparent | none | `--color-text-muted` | hover: bg surface 10% |
| **Danger** | `--color-error` | none | white | same as primary |

- **Loading:** Skeleton shimmer or spinner inside button, `pointer-events: none`
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`

### 3.2 Cards

| Type | Border | Shadow | Use |
|------|--------|--------|-----|
| **Default** | `--color-border-subtle` | `0 2px 8px rgba(0,0,0,0.06)` | Content blocks |
| **Highlighted** | `primary 25%` | + `0 0 0 1px primary 20%` | Best plan, connection status |
| **Interactive** | same | same | Clickable list items |

- **Active/press:** `transform: scale(0.99)`, `transition: 150ms ease`

### 3.3 Lists

- **Row height:** min 52px
- **Divider:** 1px `--color-border-subtle`
- **Chevron:** 16px, `--color-text-muted`, right-aligned

### 3.4 Tabs (Bottom Nav)

- **Active:** Fill primary, white text
- **Inactive:** Muted text
- **Hover (desktop):** Light primary tint
- **Icon + label:** Icon 20px, label 11px

### 3.5 Modals

- **Max height:** 90vh
- **Backdrop:** `rgba(0,0,0,0.4)` + `backdrop-filter: blur(4px)`
- **Close:** Header close icon or swipe down
- **Avoid full-screen modals** where a sheet or inline expand works

### 3.6 Toast

- **Position:** Above bottom nav, centered
- **Duration:** 3s
- **Style:** Glass surface, `--radius-md`, no heavy shadow

### 3.7 Status Indicators

| Status | Dot color | Label |
|--------|-----------|-------|
| Connected | `--color-success` | "Connected" |
| Disconnected | `--color-error` 70% mix | "Disconnected" |
| Expiring | `--color-warning` | "Expires in X days" |
| Expired | `--color-error` | "Expired" |

### 3.8 Inputs

- **Height:** 48px
- **Border:** 1px `--color-border`, focus: 1px `--color-primary`
- **Error:** Border `--color-error`, helper text below
- **Placeholder:** `--color-text-muted`

---

## 4. Interaction Model

### 4.1 Microinteractions

| Trigger | Feedback | Duration |
|---------|----------|----------|
| Button tap | `scale(0.98)` | 100ms |
| Card tap | `scale(0.99)` | 100ms |
| Tab switch | Haptic light + color transition | 150ms |
| Success (copy, pay) | Haptic success + toast | 3s |
| Error | Haptic error + inline alert | — |

### 4.2 Loading States

- **Initial load:** Skeleton for cards (height matching content), no spinners
- **Refresh:** Subtle skeleton overlay or pull-to-refresh
- **Submit:** MainButton `showProgress`, or button spinner

### 4.3 Transitions

- **Route:** None (instant) — Telegram WebView handles it
- **Modal:** Fade backdrop 200ms, slide up content 250ms
- **List reorder:** Not applicable

---

## 5. Theming Model

### 5.1 TelegramThemeBridge Extension

Extend `TelegramThemeBridge` to set CSS vars from `tg.themeParams`:

```css
:root {
  --tg-bg: var(--tg-theme-bg-color);
  --tg-text: var(--tg-theme-text-color);
  --tg-hint: var(--tg-theme-hint-color);
  --tg-link: var(--tg-theme-link-color);
  --tg-button: var(--tg-theme-button-color);
  --tg-button-text: var(--tg-theme-button-text-color);
}
```

Map `--color-bg` = `var(--tg-bg)` when in Telegram; fallback to design tokens when in browser.

### 5.2 Dark/Light

- `consumer-light` / `consumer-dark` already used via `useTheme`
- Ensure `TelegramThemeBridge` syncs `tg.colorScheme` → theme
- All components must work in both; avoid hardcoded colors

---

## 6. Implementation Guidelines (React + Vite)

### 6.1 File Structure

```
src/
├── components/     # Shared UI
├── layouts/
├── pages/
├── hooks/          # useTelegramMainButton, useTelegramBackButton, useTelegramHaptics
├── styles/
│   ├── tokens.css  # Design tokens
│   └── miniapp.css # Component-level overrides
└── api/
```

### 6.2 Token Usage

- Use `var(--token-name)` everywhere
- No magic numbers for spacing, colors, radius
- Tokens in `tokens.css` (shared) + miniapp overrides in `miniapp.css`

### 6.3 Performance

- Lazy load routes (already done)
- Skeleton for Suspense fallback
- Avoid `backdrop-filter` on low-end: use solid background fallback
- No heavy animations; `transform` + `opacity` only

### 6.4 Accessibility

- `min-height: 44px` on all tappable elements
- `aria-label` on icon-only buttons
- Focus visible for keyboard (desktop)

---

## 7. Production Checklist

- [ ] All screens use Telegram theme params or design tokens
- [ ] MainButton hidden on screens without primary action
- [ ] BackButton shown on all L1 stack screens
- [ ] Haptics on primary CTAs and success/error
- [ ] Skeleton loaders, no spinners for initial load
- [ ] Empty states for Devices, Referral, Usage
- [ ] Error fallback screen with retry
- [ ] SessionMissing for missing initData
- [ ] Safe area insets on bottom nav and main
- [ ] Touch targets ≥ 44px
- [ ] No blur on low-end: `@supports (backdrop-filter)` fallback
- [ ] Initial load < 2s (measure with Lighthouse)

---

## 8. Conversion Optimization

- **Checkout:** MainButton "Pay" always visible, amount prominent, trust line (uptime, no-logs)
- **Plan selection:** "Best value" badge on recommended plan, price anchor (monthly vs yearly)
- **Home:** Primary CTA above fold; connection status card = hero
- **ExpiringSoonBanner:** Urgency without panic, single CTA "Renew"
- **Referral:** MainButton "Copy link" = one tap; show potential reward
- **Device limit:** DeviceLimitNudge with "Upgrade" CTA, not just info

---

*Spec aligned with vpn-suite miniapp structure. Ready for implementation.*
