# Production Layout Architecture for Telegram Mini-Apps

This app uses a **5-layer layout system** that separates Telegram mechanics from UI. Pages must not invent their own layouts; all content lives inside the layout system.

## Layer stack

```
AppRoot
 ├ TelegramProvider
 │  └ TelegramEventManager
 │
 ├ SafeAreaLayer
 │
 ├ ViewportLayout
 │   ├ HeaderZone
 │   ├ ScrollZone
 │   └ ActionZone (tabbed only)
 │
 └ OverlayLayer
```

## 1. AppRoot

**Role:** Telegram boot layer. Initializes WebApp and viewport binding.

- Calls `initTelegramRuntime()` (`tg.ready()`, `tg.expand()`).
- Viewport and safe-area CSS vars are set inside TelegramProvider.

**Code:** [src/app/AppRoot.tsx](src/app/AppRoot.tsx), [src/hooks/useTelegramWebApp.ts](src/hooks/useTelegramWebApp.ts).

## 2. TelegramProvider

**Role:** Global environment. Exposes Telegram WebApp state to the tree.

- Runs [useViewportDimensions](src/hooks/useViewportDimensions.ts) (sets `--tg-viewport-height`, `--app-height`, `--safe-*` and returns values).
- Provides context: `viewportHeight`, `safeAreaInsets`, `theme`, `isFullscreen`.
- Layout and components consume via `useTelegram()`.

**Code:** [src/context/TelegramContext.tsx](src/context/TelegramContext.tsx).

## 3. TelegramEventManager

**Role:** Centralized runtime Telegram event bridge.

- Subscribes once to Telegram WebApp events.
- Emits through app event bus for hook consumers.
- Prevents distributed event subscriptions and behavior drift.

Handled events:
- `viewportChanged`
- `safeAreaChanged`
- `contentSafeAreaChanged`
- `themeChanged`
- `fullscreenChanged`
- `mainButtonClicked`
- `backButtonClicked`
- `invoiceClosed`
- `popupClosed`
- `qrTextReceived`

**Code:** [src/app/TelegramEventManager.tsx](src/app/TelegramEventManager.tsx), [src/telegram/telegramEvents.ts](src/telegram/telegramEvents.ts).

## 4. SafeAreaLayer

**Role:** Physical screen protection (notch, gesture bars, Telegram controls).

- Named wrapper; safe-area insets are applied via layout CSS (`--safe-*` vars) in shell/header/main/nav.

**Code:** [src/app/SafeAreaLayer.tsx](src/app/SafeAreaLayer.tsx).

## 5. ViewportLayout

**Role:** Main UI frame. All pages use this layout (HeaderZone + ScrollZone + ActionZone).

- **Tabbed:** HeaderZone + ScrollZone + ActionZone (tab bar).
- **Stack:** HeaderZone + ScrollZone (onboarding, checkout, servers, referral).

**Code:** [src/app/ViewportLayout.tsx](src/app/ViewportLayout.tsx) (TabbedShellLayout / StackFlowLayout). Backward-compatible shim: [src/layouts/MiniappLayout.tsx](src/layouts/MiniappLayout.tsx).

## 6. HeaderZone

**Role:** Fixed top bar. Title, nav. Height 56–64px. Never scrolls.

**Code:** [src/layout/HeaderZone.tsx](src/layout/HeaderZone.tsx).

## 7. ScrollZone

**Role:** Only scrollable area. `flex: 1`; `overflow-y: auto`. Page content lives here.

- Page padding 16px; section gap 24px; card padding 16px (from tokens).

**Code:** [src/layout/ScrollZone.tsx](src/layout/ScrollZone.tsx). Styles: `.miniapp-main` in [src/miniapp.css](src/miniapp.css).

## 8. ActionZone

**Role:** Bottom interaction (primary button, CTA, nav tabs). 72–96px.

- When **Telegram MainButton** is used, reserve bottom space (`padding-bottom: 120px + safe-bottom` in stack layout).

**Code:** [src/layout/ActionZone.tsx](src/layout/ActionZone.tsx). MainButton reserve: [src/context/MainButtonReserveContext.tsx](src/context/MainButtonReserveContext.tsx), [src/hooks/useTelegramMainButton.ts](src/hooks/useTelegramMainButton.ts).

## 9. OverlayLayer

**Role:** System UI above layout (toasts, modals, drawers, loaders).

**Code:** [src/app/OverlayLayer.tsx](src/app/OverlayLayer.tsx).

## Rules

- **One layout:** No page-owned layout; all pages render inside ScrollZone.
- **Viewport:** Use `--app-height` / `--tg-viewport-height`; never raw `100vh`.
- **MainButton:** When visible, stack layout reserves bottom space (120px + safe-bottom).
- **Keyboard:** `viewportChanged` and `visualViewport` keep height in sync when keyboard opens.

## Safe space and gestures

Full-screen mini-apps must respect OS and Telegram safe areas. Only the middle section is truly safe for interaction.

**Screen zones:**

```
┌──────────────────────────────┐
│ OS status / notch area       │  ← no tap targets in first 60px
├──────────────────────────────┤
│ HeaderZone (header)          │
├──────────────────────────────┤
│                              │
│   ScrollZone (safe content)  │
│                              │
├──────────────────────────────┤
│ ActionZone / actions         │
├──────────────────────────────┘
│ System gesture zone          │  ← safe-bottom + 20px above
└──────────────────────────────┘
```

- **Top:** No tap targets within the first 60px from the top edge. Header uses `padding-top: max(60px, env(safe-area-inset-top))` (token `--miniapp-safe-top-min`).
- **Bottom:** Bottom action area uses `padding-bottom: env(safe-area-inset-bottom) + 20px` (token `--miniapp-safe-bottom-extra`). Never place buttons within 20px of the bottom safe inset (gesture conflict zone: home bar, swipe-to-close).
- **Fullscreen height:** Use `--app-height` / `--tg-viewport-height` only; never `100vh`.
- **Scroll:** Only ScrollZone scrolls; the root page never scrolls (Telegram gestures conflict with full-page scroll).
- **Horizontal:** Main content and nav use `--safe-left` / `--safe-right` for future-proofing (foldables, landscape).
- **Minimum safe interaction area:** Top 60px, bottom 60px, side 16px. Tokens and layout enforce this.
- **Thumb zone:** Place important actions in the lower-middle of the screen.

## Spacing

8px base grid: use `--sp-*` tokens (8, 16, 24, 32, etc.) from [src/styles/miniapp-tokens.css](src/styles/miniapp-tokens.css).

## Mandatory rules (guidelines compliance)

These rules are mandatory for a stable Telegram Mini-App UI across iOS, Android, and Desktop.

| Guideline | Implementation |
|-----------|----------------|
| **1. Layout** AppRoot → SafeAreaLayer → ViewportLayout (HeaderZone, ScrollZone, ActionZone) | App tree: AppRoot, TelegramProvider, TelegramEventManager, SafeAreaLayer, then ViewportLayout with HeaderZone, ScrollZone, ActionZone. Only ScrollZone scrolls; header and action are fixed. |
| **2. Viewport** Never `100vh`; use `Telegram.WebApp.viewportHeight` or `--tg-viewport-height` | [useViewportDimensions](src/hooks/useViewportDimensions.ts) sets `--tg-viewport-height` and `--app-height`; shell uses `min-height: var(--app-height)`. Listens to `viewportChanged` and `visualViewport`. |
| **3. Safe area** Root padding from `env(safe-area-inset-*)` | Layout CSS uses `--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right` (set from env) in header, main, and ActionZone. |
| **4. Header** 56–64px; safeAreaInset.top + headerHeight; single-line title; never scrolls | HeaderZone; `--miniapp-header-height`; `padding-top: max(60px, var(--safe-top))`. Fixed position. |
| **5. ScrollZone** flex: 1; overflow-y: auto; page 16px, section 24px, card 16px | `.miniapp-main` (ScrollZone); padding and gaps via `--sp-*`. |
| **6. ActionZone** 72–96px; safe-bottom + 16px; buttons not closer than 20px from bottom | ActionZone; `padding-bottom: calc(var(--safe-bottom) + var(--miniapp-safe-bottom-extra))` (20px). |
| **7. Gesture buffers** Top ≈60px, bottom ≈60px, side 16px | `--miniapp-safe-top-min: 60px`; bottom via safe + 20px; horizontal via `--sp-4` (16px) + safe insets. |
| **8. Touch targets** Min 48×48px; ≥8px between | Primary nav/actions enforce `min-height: 48px`; interactive spacing remains `>= 8px`. |
| **9. Layout width** Design 375px; max content 420px; center on desktop | Runtime shell/content are constrained to `420px` max and centered on desktop. |
| **10. Spacing** 8px grid: 8, 16, 24, 32, 40, 48 | `--sp-*` and spacing scale in [miniapp-tokens.css](src/styles/miniapp-tokens.css). |
| **11. Theme** Use `--tg-theme-*` or adapt to Telegram theme | [TelegramThemeBridge](src/components/TelegramThemeBridge.tsx); `data-tg` and theme sync. |
| **12. Scroll** No full-page scroll; Header fixed, ScrollZone scrolls, ActionZone fixed | Single scroll container (ScrollZone); header and bottom nav fixed. |
| **13. Performance** Avoid heavy blur, nested scroll, expensive animations | Flat layouts; single scroll; minimal backdrop-filter where used. |
| **14. Keyboard** Viewport height updates when keyboard opens | `viewportChanged` (through TelegramEventManager) and `visualViewport` in useViewportDimensions. |
| **15. Testing** Test on iOS, Android, Desktop Telegram | Manual: header overlap, bottom gestures, keyboard, fullscreen. |
| **16. Blueprint** Safe top → Header → Scroll → Action → Safe bottom | Matches diagram in Safe space and gestures section above. |
| **17. UX** Fast loading; minimal header; thumb-friendly (lower-middle) | Structure and spacing support this; place primary actions in ActionZone or lower ScrollZone. |

**Final rule:** Safe areas respected, single scroll container, stable header, and bottom action zone yield consistent behavior across Telegram clients.
