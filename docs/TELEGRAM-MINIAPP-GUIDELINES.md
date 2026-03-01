# Telegram Mini App Guidelines — Production Spec

Implementation-ready guidelines for building production Telegram Mini Apps. Practical, specific, actionable for designers and engineers.

**References:** [core.telegram.org/bots/webapps](https://core.telegram.org/bots/webapps)

---

## Table of contents

1. [Platform overview](#1-platform-overview)
2. [UX rules & patterns](#2-ux-rules--patterns)
3. [UI system rules (design tokens)](#3-ui-system-rules-design-tokens)
4. [Navigation & page architecture](#4-navigation--page-architecture)
5. [Telegram WebApp API integration](#5-telegram-webapp-api-integration)
6. [Theming](#6-theming)
7. [Performance & reliability](#7-performance--reliability)
8. [Security & privacy](#8-security--privacy)
9. [Analytics & logging](#9-analytics--logging)
10. [QA checklist & acceptance criteria](#10-qa-checklist--acceptance-criteria)
11. [Anti-patterns](#11-anti-patterns)
12. [Example reference flows](#12-example-reference-flows)

---

## 1. Platform overview

### Where Mini App lives

- **Launch modes:** Main Mini App, menu button, inline button, keyboard button, direct link, attachment menu
- **Viewport:** Half-screen by default; expandable to full via `expand()` or user drag
- **Desktop:** Same codebase; larger viewport; keyboard/mouse instead of touch

### Mobile-first reality

- 80%+ users on mobile
- Design for thumb reach; primary actions in lower half
- Desktop Telegram: same WebView; wider layout, hover states

### Safe areas / insets

- **System safe area:** `--tg-safe-area-inset-top`, `--tg-safe-area-inset-bottom`, `--tg-safe-area-inset-left`, `--tg-safe-area-inset-right` (Bot API 8.0+)
- **Content safe area:** `--tg-content-safe-area-inset-*` for overlap with Telegram UI
- **Bottom nav:** `padding-bottom: env(safe-area-inset-bottom, 0)`
- **Header:** `padding-inline: calc(var(--space-4) + env(safe-area-inset-left, 0))`

### Keyboard behavior

- Use `hideKeyboard()` (Bot API 9.1+) when appropriate
- Avoid layout jump: fixed/sticky headers; `scroll-padding-bottom` for inputs
- Do not rely on `viewportHeight` for bottom-pinned elements; use `viewportStableHeight`

### Constraints

| Constraint | Target |
|-----------|--------|
| Perceived lag | < 300ms |
| Initial load | < 3s on slow 3G |
| Memory | Minimize JS heap; lazy load routes |
| Touch targets | Min 44×44px |
| Network | Unreliable; assume offline / slow |

---

## 2. UX rules & patterns

### First session onboarding

- **0 friction:** No mandatory signup before core flow
- Call `ready()` as soon as essential UI is visible
- No splash screens unless strictly required

### Session continuity

- Use **CloudStorage** or **DeviceStorage** (Bot API 9.0+) for resume state
- On return: restore last screen, scroll position where practical
- Avoid re-auth on every open when possible

### Error recovery

- **Offline:** Persistent banner; disable primary actions; retry when online
- **Timeout:** 10–15s; clear copy: "Request timed out. Try again."
- **API errors:** Inline message + retry CTA; avoid blocking modals

### Loading strategy

| Scenario | Use | Avoid |
|----------|-----|-------|
| List loading | Skeleton | Spinner |
| Short action (1–3s) | Spinner | Skeleton |
| Non-critical write | Optimistic UI | Blocking spinner |
| Long flow | Progress steps | Single spinner |

### Forms

- One primary action per form
- Inline validation; show errors on blur/submit
- Input masks for phone, card, etc.
- Keyboard-friendly: `autocomplete`, correct `type`, logical tab order

### One primary action per screen

- One main CTA; secondary actions via ghost/outline
- Use MainButton for the primary action when applicable

### Progressive disclosure

- Accordions, tabs, bottom sheets for secondary content
- Don't dump all options at once; reveal on demand

### Copywriting style

- Short, directive: "Connect", "Retry", "Save"
- Avoid jargon; use active voice

### Pattern library

| Pattern | Use case |
|---------|----------|
| **Dashboard → Detail → Action → Confirm → Result** | Core transactional flows |
| **List → Filters → Item → Bottom sheet action** | Browsing + quick actions |
| **Settings / Profile / Support** | Account and help sections |

---

## 3. UI system rules (design tokens)

### Typography

| Token | Size | Weight | Line height | Use |
|-------|------|--------|-------------|-----|
| H1 | 24px | 600 | 1.2 | Page title |
| H2 | 18px | 600 | 1.25 | Section title |
| H3 | 16px | 600 | 1.3 | Card title |
| Body | 16px | 400 | 1.4 | Main content |
| Sm | 14px | 400 | 1.4 | Secondary text |
| Caption | 12px | 400 | 1.35 | Labels, metadata |
| Button | 16px | 600 | 1 | CTAs |

**Font stack:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Numeric data:** `font-variant-numeric: tabular-nums`

### Spacing

- **Grid:** 8px base
- **Section padding:** 16px
- **Card padding:** 16px
- **Touch target min:** 44px

### Components

| Component | Variants | States |
|-----------|----------|--------|
| **Buttons** | primary, secondary, ghost, destructive | default, hover, active, disabled, loading, error |
| **Inputs** | text, password, number | default, focus, error, disabled |
| **Lists** | Row min 48px; compact (40px) for dense lists; relaxed (56px) for primary content |
| **Cards** | Bordered; no heavy shadows | default, hover (desktop), active |
| **Tabs** | Horizontal; active state | default, active, disabled |
| **Modals vs Bottom sheets** | Use bottom sheets on mobile; modals on desktop |
| **Toasts / Banners** | Position above bottom nav; auto-dismiss or close CTA |
| **Empty states** | Icon + short copy + CTA |
| **Badges** | Small; status colors (success, warning, error, info) |

### Component states (required for each)

| State | Buttons | Inputs | Lists | Cards | Tabs |
|-------|---------|--------|-------|-------|------|
| **Default** | Base style | Neutral border | Normal row | Bordered surface | Muted text |
| **Hover** | Opacity 0.9 (desktop) | Border highlight | Row highlight | Slight elevation | Text brighter |
| **Active** | Scale 0.98 | Focus ring | Selected bg | Selected border | Accent color |
| **Disabled** | Opacity 0.5; no pointer | Gray bg; no input | Dimmed | Dimmed | Dimmed |
| **Loading** | Spinner; disabled | — | Skeleton | Skeleton | — |
| **Error** | Destructive border | Red border; error msg | — | Error border | — |

### Cards: when to use / when not

| Use cards for | Avoid cards for |
|---------------|-----------------|
| Grouped content (subscription, device, plan) | Simple row actions |
| Tappable items with multiple data points | Single-line links |
| Bordered sections in a list | Full-width lists |

### Token reference (copy-paste)

```css
/* Typography */
--font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--text-h1: 24px;
--text-h2: 18px;
--text-h3: 16px;
--text-body: 16px;
--text-sm: 14px;
--text-caption: 12px;

/* Spacing (8px grid) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;

/* Touch */
--size-touch-target: 44px;

/* Radius */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

---

## 4. Navigation & page architecture

### Max depth

- **Recommended:** 2–3 levels
- Avoid 4+ levels; flatten or use tabs

### Tabs vs list navigation

- **Tabs:** Peer sections (Home, Servers, Plan, Account)
- **List / drill-down:** Hierarchical content

### Back behavior

- **Telegram BackButton:** Show on detail/stack pages only; hide on tab/root screens
- **Handler:** `navigate(-1)` or custom logic; always hide BackButton on unmount

### Breadcrumbs

- **Avoid** in Mini Apps; use header title instead

### Routing

- SPA routing; lazy-load routes
- Deep links: `start_param` / `tgWebAppStartParam` in URL

---

## 5. Telegram WebApp API integration

### MainButton

| Do | Don't |
|----|-------|
| Show for primary CTA (checkout, confirm, submit) | Leave visible on non-action screens |
| Use `showProgress()` during async; `hideProgress()` on done | Omit loading state |
| Use `disable()` during submit; `enable()` on error | Allow double-submit |
| Hide when leaving action screens | Forget to hide on route change |

**When to show:** Checkout, confirm, submit, primary form action.

**Label rules:** Short, directive (e.g. "Pay", "Confirm", "Save").

### BackButton

| Do | Don't |
|----|-------|
| Show on detail/stack pages | Show on tab/root screens |
| Hide on unmount | Forget cleanup |
| Use `navigate(-1)` or equivalent | Use `close()` for back |

### HapticFeedback

| When | Use |
|------|-----|
| Tap on tappable element | `impactOccurred('light')` |
| Success (save, connect) | `notificationOccurred('success')` |
| Error | `notificationOccurred('error')` |
| Selection change (picker, tabs) | `selectionChanged()` |

| Don't | |
|-------|---|
| Use on every scroll | |
| Use `selectionChanged` on confirm | Use `notificationOccurred('success')` |

### themeParams

- Map to CSS vars: `--tg-theme-bg-color`, `--tg-theme-text-color`, etc.
- Listen to `themeChanged`; re-apply vars
- See [Section 6](#6-theming) for mapping table.

### expand() / viewport

- Call `expand()` early for full-height UX if needed
- Use `viewportStableHeight` for bottom-pinned UI; not `viewportHeight`

### close()

- Use after `sendData()` or when flow is complete
- Don't use as generic back

### Auth / user context

- Use `initData` (validated server-side) for user identity
- Never trust `initDataUnsafe` on server

### In-app browser quirks

| Quirk | Handling |
|-------|----------|
| `viewportHeight` updates during swipe | Use `viewportStableHeight` for bottom-pinned UI |
| Main button hidden until first tap (attachment menu) | Ensure CTA is in viewport; prompt tap if needed |
| Theme may be missing on first paint | Fallback colors; re-apply on `themeChanged` |
| `ready()` hides loading immediately | Call as soon as shell renders; don't wait for data |
| Direct link vs inline: different `initData` | Handle both; validate `initData` server-side |
| `close()` is final | Only call after flow complete; not for back |

### Code snippets

**Theme bridge (apply themeParams to CSS vars):**

```tsx
useEffect(() => {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  const params = tg.themeParams;
  if (!params) return;
  const root = document.documentElement;
  if (params.bg_color) root.style.setProperty("--tg-theme-bg-color", params.bg_color);
  if (params.text_color) root.style.setProperty("--tg-theme-text-color", params.text_color);
  if (params.hint_color) root.style.setProperty("--tg-theme-hint-color", params.hint_color);
  if (params.button_color) root.style.setProperty("--tg-theme-button-color", params.button_color);
  if (params.button_text_color) root.style.setProperty("--tg-theme-button-text-color", params.button_text_color);
  if (params.secondary_bg_color) root.style.setProperty("--tg-theme-secondary-bg-color", params.secondary_bg_color);
  const handler = () => { /* re-apply */ };
  tg.onEvent?.("themeChanged", handler);
  return () => tg.offEvent?.("themeChanged", handler);
}, []);
```

**MainButton hook pattern:**

```tsx
useEffect(() => {
  if (!options) return;
  const mb = window.Telegram?.WebApp?.MainButton;
  if (!mb) return;
  mb.setText(options.text);
  options.visible ? mb.show() : mb.hide();
  options.enabled ? mb.enable() : mb.disable();
  options.loading ? mb.showProgress?.() : mb.hideProgress?.();
  mb.onClick?.(options.onClick);
  return () => { mb.offClick?.(options.onClick); mb.hide(); };
}, [options]);
```

**BackButton hook pattern:**

```tsx
useEffect(() => {
  if (!enabled) return;
  const bb = window.Telegram?.WebApp?.BackButton;
  if (!bb) return;
  bb.show();
  bb.onClick?.(() => navigate(-1));
  return () => { bb.offClick?.(() => navigate(-1)); bb.hide(); };
}, [enabled, navigate]);
```

---

## 6. Theming

### Token mapping (app → Telegram fallback)

| App token | Telegram theme param | Fallback (dark) |
|-----------|----------------------|-----------------|
| `--color-bg` | `--tg-theme-bg-color` | #0A0A0A |
| `--color-text` | `--tg-theme-text-color` | #FFFFFF |
| `--color-text-muted` | `--tg-theme-hint-color` | #8A8A8A |
| `--color-accent` | `--tg-theme-button-color` | #E31937 |
| `--color-on-accent` | `--tg-theme-button-text-color` | #FFFFFF |
| `--color-surface` | `--tg-theme-secondary-bg-color` | #141414 |

### Dark-first vs dual theme

- **Dark-first:** Default dark; light via `colorScheme`
- **Dual theme:** Use `colorScheme` to switch; apply themeParams in both

### Contrast

- **Text:** WCAG AA 4.5:1
- **UI:** 3:1 minimum

### Border / divider

- Use `--tg-theme-secondary-bg-color` or derived muted color

### Links

- Use `--tg-theme-link-color` or accent for emphasis

---

## 7. Performance & reliability

### Initial load

- **Target:** < 3s on slow 3G
- Call `ready()` as soon as shell is visible

### JS bundle

- Code-split per route; lazy-load pages
- Keep vendor chunk small; tree-shake

### Images

- Prefer SVG for icons
- Compressed WebP/PNG; responsive `srcset`
- No large full-screen background images

### Avoid

- Heavy `filter: blur()`
- Many nested `box-shadow`s
- Expensive animations (prefer `transform`/`opacity`)

### Caching

- **CloudStorage:** User preferences, session state (Telegram-synced)
- **DeviceStorage** (Bot API 9.0+): Persistent local data per device
- **localStorage:** Non-sensitive UI state (e.g. last tab); safe for ephemeral data
- **IndexedDB:** Larger datasets; use where safe (no tokens/PII)

### Offline / poor network

- Detect offline; show banner
- Retry with exponential backoff (1s, 2s, 4s, …)
- Queue critical writes; sync when online

### Prevent double-submit

- Disable MainButton + `showProgress()` during submit
- Re-enable on error

---

## 8. Security & privacy

### Don't trust client data

- Validate `initData` server-side (HMAC-SHA256)
- Never trust `initDataUnsafe` for auth/authorization

### Token storage

- Use **SecureStorage** (Bot API 9.0+) for tokens and secrets
- Avoid `localStorage` for sensitive data

### PII

- Minimize collection
- Redact in logs (no raw user IDs, names, etc. in production logs)

### Rate limiting

- Server-side rate limits
- Client debounce for high-frequency actions

### Abuse vectors

- Validate `start_param`; reject invalid/malformed
- Rate-limit critical endpoints

### CSRF / CORS

- Validate `Origin` / `Referer`; allow only Telegram origins
- Use SameSite cookies where applicable

---

## 9. Analytics & logging

### Event naming

- `snake_case`: `screen_view`, `cta_click`, `checkout_start`

### Required events

| Event | When |
|-------|------|
| `app_open` | Mini App opened |
| `screen_view` | Route/screen change |
| `cta_click` | Primary CTA clicked |
| `checkout_start` | Checkout flow started |
| `checkout_complete` | Payment successful |
| `error` | Client-side error |

### Funnels

- Onboarding
- Checkout
- Support / help

### Error logging

- Structured format; Sentry-like
- Include: message, route, user-agent (redacted)
- Redact PII

### Performance metrics

- TTFB, FCP, route load time

---

## 10. QA checklist & acceptance criteria

### UI

- [ ] 8px spacing grid
- [ ] Typography: H1/H2/body/caption per spec; tabular nums for numbers
- [ ] Component states: default, hover, active, disabled, loading, error
- [ ] Touch targets ≥ 44px
- [ ] Overflow handled (truncation, scroll)
- [ ] Long text (names, titles) handled
- [ ] i18n: no hardcoded strings; RTL if supported

### UX

- [ ] BackButton correct (show on detail, hide on root)
- [ ] Session resume works
- [ ] Empty states with CTA

### Telegram

- [ ] Theme switch (light ↔ dark) applied
- [ ] MainButton: correct label, loading state, hidden when no CTA
- [ ] Haptics on tap/success/error

### Performance

- [ ] Slow 3G: load < 5s; no blocking spinner > 3s
- [ ] Low-end Android: no jank; 60fps target

### Accessibility

- [ ] Contrast ≥ 4.5:1 text
- [ ] Focus visible
- [ ] `prefers-reduced-motion` respected

### Reliability

- [ ] Retry on timeout
- [ ] Partial failure: show partial data, retry failed parts

### Definition of Done

- All checklist items pass
- No P0 bugs

---

## 11. Anti-patterns

| Anti-pattern | Fix |
|--------------|-----|
| Deep navigation (4+ levels) | Flatten; use tabs |
| No feedback on tap | Haptic + visual (e.g. scale) |
| Spinners everywhere | Skeleton for lists; optimistic UI where possible |
| Touch targets < 44px | Min 44×44px |
| Layout jump on keyboard open | Fixed header; scroll-padding |
| Ignoring Telegram theme | Use themeParams; listen to themeChanged |
| Modal abuse | Bottom sheets on mobile |
| No offline/timeout handling | Banner; retry; timeouts |
| Over-animated UI | 60fps; respect prefers-reduced-motion |

---

## 12. Example reference flows

### Flow 1: Onboarding → Home → Action → Success

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| Onboarding | N/A | N/A | N/A |
| Home | Skeleton cards | Retry banner | N/A |
| Action | Spinner on CTA | Inline error + retry | N/A |
| Success | N/A | N/A | N/A |

### Flow 2: List → Detail → Confirm → Result

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| List | Skeleton rows | Retry banner | "No items" + CTA |
| Detail | Spinner | Inline + retry | N/A |
| Confirm | MainButton progress | Payment error modal | N/A |
| Result | N/A | N/A | N/A |

### Flow 3: Settings → Change plan → Payment → Receipt

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| Settings | Skeleton sections | Retry banner | N/A |
| Plan selection | Skeleton plan cards | Retry | "No plans" + support link |
| Payment | MainButton progress | Payment error modal | N/A |
| Receipt | N/A | N/A | N/A |

### Flow 4: Profile → Edit → Save → Success

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| Profile | Skeleton rows | Retry banner | N/A |
| Edit | N/A | Inline validation | N/A |
| Save | MainButton progress | Inline error + retry | N/A |
| Success | N/A | N/A | Toast + redirect |

### Flow 5: Support / Help → Topic → Submit → Sent

| Screen | Loading | Error | Empty |
|--------|---------|-------|-------|
| Support home | Skeleton list | Retry banner | N/A |
| Topic detail | Spinner | Inline + retry | N/A |
| Submit form | MainButton progress | Validation + retry | N/A |
| Sent | N/A | N/A | Success state + close CTA |

---

## Appendix: Quick reference

### CSS vars from themeParams

```css
--tg-theme-bg-color
--tg-theme-text-color
--tg-theme-hint-color
--tg-theme-link-color
--tg-theme-button-color
--tg-theme-button-text-color
--tg-theme-secondary-bg-color
```

### Safe area (Bot API 8.0+)

```css
--tg-safe-area-inset-top
--tg-safe-area-inset-bottom
--tg-safe-area-inset-left
--tg-safe-area-inset-right
--tg-content-safe-area-inset-top
--tg-content-safe-area-inset-bottom
--tg-content-safe-area-inset-left
--tg-content-safe-area-inset-right
```

### Viewport

- `--tg-viewport-height` — updates during gestures
- `--tg-viewport-stable-height` — use for bottom-pinned UI
