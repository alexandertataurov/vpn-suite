# CSS Consistency Audit — Viewports & Devices (Desktop, Android, iOS)

**Date**: 2026-03-19

## Executive Summary

The miniapp has solid foundations (safe-area, viewport height, platform-specific fullscreen buffers) but suffers from **breakpoint fragmentation**, **magic-number viewport widths**, and **documentation drift**. No critical cross-device bugs were found; platform-specific handling is limited and intentional.

---

## 1. Breakpoint Inconsistency (DRIFT)

### Canonical sources (conflicting)

| Source | sm | md | lg | xl |
|--------|-----|-----|------|------|
| `_breakpoints.css` | 480 | 768 | 1024 | 1280 |
| `base.css` | 640 | 768 | 1024 | 1280 |
| `layout-architecture.md` | 600 | 900 | 1200 | — |

**Recommendation**: Pick one canonical set. `_breakpoints.css` + `breakpoints.ts` (480/768/1024/1280) are the JS/design-system source; update `layout-architecture.md` and `base.css` to match.

---

## 2. Viewport Magic Numbers (WARNING)

### Hardcoded widths in media queries (not tokens)

| Width | Usage | Files |
|-------|-------|-------|
| 320px | iPhone SE, smallest supported | frame.css, SettingsAccountOverviewCard, NoDeviceCallout.stories |
| 340px | NoDeviceCallout narrow | NoDeviceCallout.css |
| 359px | ProgressBar, frame.css | ProgressBar.css, frame.css |
| 360px | Common narrow breakpoint | routes.css, responsive.css, RowItem, ActionBanner, DisclosureItem, PlanCard, SettingsAccountOverviewCard, Modal |
| 375px | TroubleshooterFlowCard | TroubleshooterFlowCard.css |
| 380px | frame.css | frame.css |
| 390px | iPhone 14 target, Storybook default | frame.css, library.css, SplashAndLoading |
| 408px | frame.css | frame.css |
| 420px | routes.css, frame.css, Modal | routes.css, frame.css, Modal.css |
| 429px | frame.css | frame.css |
| 430px | zones.css, frame.css | zones.css, frame.css |
| 480px | BottomSheet, Modal, frame.css, zones.css | Multiple |
| 560px | routes.css, library.css, InlineAlert | Multiple |
| 720px | routes.css | routes.css |
| 768px | zones.css, BillingPeriodToggle, RowItem, ActionBanner, PageLayout, ProgressBar, InlineAlert | Multiple |

**Recommendation**: Introduce viewport tokens for narrow breakpoints used across components:

```css
:root {
  --vp-narrow: 360px;   /* small phones */
  --vp-mobile: 390px;   /* target mobile */
  --vp-wide-mobile: 430px;
  --vp-tablet: 768px;
}
```

Use `@media (max-width: var(--vp-narrow))` instead of raw `360px`. Consolidate 359/360/375 into a single token where behavior is equivalent.

---

## 3. Platform-Specific CSS (iOS vs Android)

### Current handling

| Area | iOS | Android | Notes |
|------|-----|---------|-------|
| Fullscreen top buffer | 24px | 20px | `zones.css` via `data-tg-platform` |
| Safe-area insets (Storybook) | top: 59/20, bottom: 34 | top: 24, bottom: 0/24 | `telegramEnvironment.tsx` |
| Touch targets | 48px shared | 48px shared | mobile-platform-guidelines.md |
| Pull-to-refresh timing | iOS profile | Android profile | `pullToRefresh.ts` |

**Consistency**: Platform differences are intentional and documented. No drift found.

### Gaps

- **No Android-specific scroll/overscroll** styling (e.g. `overscroll-behavior`) — acceptable per guidelines.
- **`-webkit-` prefixes** used for iOS Safari (backdrop-filter, line-clamp, tap-highlight, overflow-scrolling). Standard fallbacks exist; no Android-specific prefixes needed.

---

## 4. Desktop vs Mobile

### Breakpoints used for desktop layout

- `min-width: 768px` — primary tablet/desktop switch (zones, PageLayout, RowItem, etc.)
- `min-width: 720px` — routes.css (single use)
- `min-width: 1024px` — base.css operator console

**E2E coverage**: `responsive-layout.spec.ts` tests 320, 360, 390, 768, 1024.

**Recommendation**: Replace `720px` with `768px` (or `var(--bp-md)`) for consistency.

---

## 5. Safe-Area & Viewport Height

| Mechanism | Status |
|-----------|--------|
| `env(safe-area-inset-*)` | ✓ Used via `--safe-top`, `--safe-bottom` |
| `viewport-fit=cover` | ✓ index.html, preview-head.html |
| `--app-height` | ✓ From `useViewportDimensions` / Telegram SDK |
| `100dvh` fallback | ✓ base.css |
| `-webkit-fill-available` | ✓ zones.css for shell height |

**Consistency**: Good. No hardcoded vh in layout.

---

## 6. Touch vs Pointer

| Query | Purpose | Files |
|-------|---------|-------|
| `@media (pointer: coarse)` | Larger touch targets on touch devices | SettingsAccountOverviewCard, SettingsAccountCard |
| `@media (pointer: fine)` | Hover/compact layout on mouse | RowItem, DisclosureItem |

**Consistency**: Correct pattern for device-agnostic UX.

---

## 7. Reduced Motion

`@media (prefers-reduced-motion: reduce)` used in: routes.css, frame.css, NoDeviceCallout, SettingsAccountOverviewCard, BillingPeriodToggle, DisclosureItem, zones.css.

**Consistency**: Applied where motion exists.

---

## 8. Checklist for New CSS

| Check | Action |
|-------|--------|
| Breakpoints | Use `var(--bp-sm)` etc. or new `--vp-*` tokens |
| Viewport widths | Avoid new magic numbers; add token if needed |
| Safe areas | Use `env(safe-area-inset-*)` or `--safe-*` |
| Platform | Prefer shared rules; use `data-tg-platform` only when necessary |
| Touch targets | ≥ 48px; use `--size-touch-target` |
| Horizontal overflow | Test at 320px, 360px, 390px |

---

## 9. Recommended Next Steps

1. ~~**Align breakpoint docs**~~ — Done. `layout-architecture.md` updated to 480/768/1024/1280.
2. ~~**Introduce `--vp-*` tokens**~~ — Done. Added in `_breakpoints.css`: `--vp-minimal`, `--vp-narrow`, `--vp-mobile`, `--vp-mid-mobile`, `--vp-wide-mobile`, `--vp-compact`.
3. ~~**Consolidate 359/360**~~ — Done. All use `--vp-narrow` (360px).
4. ~~**Replace 720px**~~ — Done. Replaced with `var(--bp-md)` (768px) in routes.css, base.css, zones.css.
5. **Add Storybook viewport for Android** — Ensure `tgPlatform: android` is tested in page stories (currently default is iOS).
