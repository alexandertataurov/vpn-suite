# Miniapp layout architecture (fluid, mobile-first)

## Summary: fixed assumptions removed

| Removed | Replaced with |
|---------|----------------|
| `100vh` / `100dvh` in layout | `var(--app-height)` set by JS |
| Hard-coded widths (56px, 48px, 80px) | Tokens: `--height-header`, `--height-button` |
| Per-page layout wrappers | Single `miniapp-layout` or `miniapp-stack` |
| Magic paddings | `--container-pad`, `--space-*` |
| Duplicate responsive breakpoints | `--bp-sm`, `--bp-md`, `--bp-lg`, `--bp-xl` |
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
--height-header, --height-button
--space-1..12 (8px grid: 4,8,12,16,20,24,32,48)
--bp-sm: 480px, --bp-md: 768px, --bp-lg: 1024px, --bp-xl: 1280px
--vp-narrow: 360px, --vp-mobile: 390px, --vp-wide-mobile: 430px
```

### 4. App shells

- **StackFlowLayout** (full-page scroll): all routes use a single scroll container with `height: var(--app-height)`, `overflow-y: auto`. Uses `HeaderZone`, `ScrollZone`.

### 5. Single scroll container

- Main content scrolls inside `ScrollZone` (`miniapp-main`).
- No nested scroll unless justified.

### 6. Responsive

- Mobile default; `@media (min-width: var(--bp-md))` for tablet; `@media (min-width: var(--bp-lg))` for desktop
- Max-width: 480px mobile, 768px tablet+; 90vw cap at 1024px+
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
| Accessibility gate | ✓ [docs/accessibility-checklist.md](../../../docs/accessibility-checklist.md) |
