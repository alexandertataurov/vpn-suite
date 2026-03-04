# Miniapp layout architecture (fluid, mobile-first)

## Summary: fixed assumptions removed

| Removed | Replaced with |
|---------|----------------|
| `100vh` / `100dvh` in layout | `var(--app-height)` set by JS |
| Hard-coded widths (56px, 48px, 80px) | Tokens: `--height-header`, `--height-button` |
| Per-page layout wrappers | Single `miniapp-layout` or `miniapp-stack` |
| Magic paddings | `--container-pad`, `--space-*` |
| Duplicate responsive breakpoints | `600px` (sm), `900px` (md) |
| `overflow: hidden` masking | Proper `min-width: 0`, `text-overflow`, `overflow-wrap` |

## New layout architecture

### 1. Viewport (--app-height)

- **`useViewportDimensions`** sets `--app-height` from `window.innerHeight`
- Subscribes to: `resize`, `orientationchange`, `visualViewport.resize`, `visualViewport.scroll`
- Fixes iOS 100vh bug, keyboard viewport shrink

### 2. Safe areas

- `--safe-top`, `--safe-bottom` via `env(safe-area-inset-*)`
- Applied to: header padding-top, bottom-nav padding-bottom, modals

### 3. Tokens

```text
--container-max, --container-pad
--app-height, --safe-top, --safe-bottom
--height-header, --height-bottom-nav, --height-button
--space-1..12 (8px grid: 4,8,12,16,20,24,32,48)
--bp-sm: 600px, --bp-md: 900px, --bp-lg: 1200px
```

### 4. App shells

- **MiniappLayout**: header + main (scroll) + bottom nav. Used by Home, Plan, Devices, Servers, Usage, Support, Settings.
- **miniapp-stack**: full-page scroll container. Used by Checkout, Referral. Single scroll container with `height: var(--app-height)`, `overflow-y: auto`.

### 5. Single scroll container

- Layout routes: `miniapp-main` scrolls
- Stack routes: `miniapp-stack` scrolls
- No nested scroll unless justified

### 6. Responsive

- Mobile default; `@media (min-width: 600px)` for tablet; `@media (min-width: 900px)` for desktop
- Max-width: 480px mobile, 600px desktop; 90vw cap at 900px+
- Buttons: full-width mobile, auto desktop
- Plan list, feature grid: 1 col mobile, 2 col tablet+

## QA checklist

| Item | Status |
|------|--------|
| No horizontal scroll (320px → desktop) | ✓ overflow-x: hidden, min-width: 0 |
| No clipped content | ✓ text-overflow, overflow-wrap |
| No overlapping fixed elements | ✓ safe areas, padding-bottom |
| Inputs usable under keyboard (iOS/Android) | ✓ useScrollInputIntoView, scroll-padding |
| No 100vh dependence | ✓ var(--app-height) only |
| Single scroll container | ✓ main or stack |
| Pages share layout shell | ✓ MiniappLayout or miniapp-stack |
| Spacing from tokens only | ✓ --space-*, --container-pad |
| Desktop centered, max-width | ✓ 600px max, 90vw at 900px |
