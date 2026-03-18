# Animation Audit — Hero Animations

## Root Cause: prefers-reduced-motion

**base.css:779-789** and **frame.css:3889-3910** disable or shorten animations when the user has "Reduce motion" enabled (OS, browser, or Telegram WebView).

---

## 1. prefers-reduced-motion (PRIMARY)

| File | Rule | Effect |
|------|------|--------|
| base.css:779 | `* { animation-duration: 0.01ms !important }` | All animations complete in 0.01ms — invisible |
| frame.css:3889 | `.card`, `.miniapp-main>.tab-content>*`, etc. | `animation: none` on listed elements |

**When it applies:** User has "Reduce motion" in:
- macOS: System Settings → Accessibility → Display
- iOS: Settings → Accessibility → Motion
- Chrome: DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`
- Telegram WebView: May inherit from device

---

## 2. Bypass for Testing

**App URL:** `?animations=force` — e.g. `http://localhost:5175/webapp/?animations=force`

**App (dev):** Bypass set automatically when `import.meta.env.DEV` (main.tsx) or when hostname is localhost/127.0.0.1 (index.html). Ensures animations visible during local development.

**Storybook:** `preview-init.ts` runs before design-system CSS and sets `data-animations="force"`. Toolbar "Force animations" toggle syncs via `withMiniAppShell`.

**Or console:** `document.documentElement.setAttribute('data-animations', 'force'); location.reload();`

---

## 3. Selector Verification

| Component | Classes | Animation |
|-----------|---------|-----------|
| NewUserHero | `new-user-hero hero-card` | hero-enter + hero-border-pulse-neutral |
| PlanCard (Home) | `PlanCard_root_xxx hero-card` | hero-border-in + hero-border-pulse |
| PlanCard (Plan page) | `PlanCard_root_xxx hero-card` | hero-border-in + hero-border-pulse (eyebrow passed) |
| PlanBillingHeroCard | `modern-hero-card` | hero-enter + hero-border-pulse-neutral |
| ListCard | `modern-list` | Uses `.card-row` for up animation; not `.card` |

PlanCard only gets `hero-card` when `eyebrow` is set (PlanCard.tsx:82). Plan page passes `eyebrow={t("plan.current_plan_label")}` when subscribed.

---

## 4. Reduced-Motion Rules Without Bypass

These rules do **not** use `html:not([data-animations="force"])` — they always apply when reduced-motion is on:

| File | Selector | Effect |
|------|----------|--------|
| zones.css:664 | `.miniapp-main`, `.miniapp-header-inner` | `animation: none` when overlay-active |
| routes.css:662 | `.home-signal-card`, `.device-row-motion`, etc. | `animation: none` |
| DisclosureItem.css:104 | (reduced-motion block) | — |
| SettingsAccountCard.css:195 | (reduced-motion block) | — |

None target hero cards directly. `.miniapp-main` animation:none affects the shell, not children.

---

## 5. frame.css Reduced-Motion Targets

Elements that get `animation: none` when reduced-motion (with bypass):

- `.btn`, `.btn-state`, `.card`, `.op`
- `.miniapp-scroll-content`, `.miniapp-main>.tab-content>*`, `.miniapp-main>.miniapp-scroll-content>.tab-content>*`
- `.miniapp-popover-overlay`, `.miniapp-popover-panel`, `.modal-backdrop`, `.modal-shell`, `.modal`
- `.miniapp-shell-context-action svg`, `.miniapp-shell-context-gesture-indicator::after`, `.miniapp-popover-sheet-handle`, `.modal-handle`

PlanCard uses `PlanCard_root_xxx`, not `.card`. NewUserHero uses `new-user-hero`, not `.card`. So hero cards are not in this list.

---

## 6. CSS Load Order

1. main.tsx → design-system/styles/index.css (base, layout, shell, library, modern)
2. main.tsx → styles/app/index.css (app, routes)
3. Lazy: PlanCard.module.css when Home chunk loads

---

## 7. Cascade / Specificity

- PlanCard `.root.hero-card` (2 classes) overrides modern.css `.hero-card` (1 class).
- PlanCard.module.css loads with Home chunk, after design-system.

---

## 8. Other Factors

- **Plan.tsx** `shouldReduceMotion()` — used only for `scrollIntoView({ behavior })`, not CSS.
- **usePrefersReducedMotion** — used by Devices, Toast, Modal for duration/behavior; does not add classes.
- **Playwright** `animations: "disabled"` — only for screenshot comparison, not dev runtime.
- **index.html** — `?animations=force` sets bypass before main.tsx; runs synchronously in head.

---

## 9. Likely Failure Modes

| Mode | Description | Mitigation |
|------|-------------|------------|
| **Wrong document (Storybook)** | preview-init or preview-head runs in manager context instead of preview iframe; attribute set on wrong `<html>` | Verify at runtime: inspect preview iframe, run `document.documentElement.getAttribute("data-animations")` |
| **Timing: CSS before bypass** | CSS loads before attribute is set | index.html and preview-head run at parse time; preview-init is first import |
| **prefers-reduced-motion OFF** | User has reduced motion OFF; base.css rule never matches; animations should work | If still broken, cause is elsewhere (wrong classes, missing elements) |
| **Toolbar removes bypass** | Storybook "Respect reduced motion" removes attribute via useEffect | Default is force; first frame may have bypass from preview-init |
| **Telegram WebView** | Inherits device "Reduce motion"; URL may not include `?animations=force` | No in-app toggle; use `?animations=force` for testing |

---

## 10. Verification Steps (Manual)

1. **Confirm reduced motion** — DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`. Reload. Animations should disappear.

2. **Confirm bypass in app** — Open `http://localhost:5175/webapp/?animations=force`, reload. Console: `document.documentElement.getAttribute("data-animations")` → `"force"`. Animations should appear.

3. **Confirm bypass in Storybook** — Open a story. In preview iframe (right-click → Inspect → select iframe): `document.documentElement.getAttribute("data-animations")` → `"force"`.

4. **Inspect computed animation** — Select hero element → Computed → `animation-duration`. Expect `0.01ms` when reduced motion + no bypass, or `450ms`/`500ms` when bypass is on.

5. **Check correct document** — In Storybook, ensure inspected `document` is the preview iframe's document, not the manager's.

6. **Diagnostic log** — Console shows `[anim] bypass set force reduced-motion: true/false` on load (Storybook and app with `?animations=force`).

---

## 11. Nuclear Override (modern.css)

When bypass is set, `html[data-animations="force"]` + hero selectors explicitly restore `animation-duration: 0.5s !important` to override base.css. Covers timing or document-context bugs.
