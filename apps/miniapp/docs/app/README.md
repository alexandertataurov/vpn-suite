# App Layer

Application composition root for the miniapp. Composes providers, layouts, bootstrap, and routes.

## Composition flow

```
main.tsx
  └── bootstrapTelemetry() (synchronous start)
  └── QueryClientProvider → ThemeProvider → BrowserRouter → App
        └── App
              └── AppErrorBoundary → AppShell
                    └── AppRoot (rAF: initTelegramRuntime)
                    └── TelegramProvider (viewport, safe area, platform)
                    └── TelegramThemeBridge
                    └── TelegramEventManager
                    └── SafeAreaLayer
                    └── MainButtonReserveProvider
                    └── OverlayLayer
                    └── WebappAuthRefresh
                    └── Suspense (fallback: TelegramLoadingScreen)
                    └── BootstrapController (auth, session, onboarding gate)
                          └── Routes (when app_ready or onboarding)
```

## Provider hierarchy (outer → inner)

1. **AppRoot** — Telegram WebApp init (ready, expand, fullscreen, disable swipes)
2. **TelegramProvider** — Viewport dimensions, safe-area insets, platform; sets `--tg-*` and `--safe-*` CSS vars
3. **TelegramThemeBridge** — Syncs theme from Telegram or OS to ThemeProvider
4. **TelegramEventManager** — Subscribes to Telegram WebApp events; emits via `telegramEvents.ts`
5. **SafeAreaLayer** — Container for notch/gesture bars; CSS applies `--safe-*` from TelegramProvider
6. **MainButtonReserveProvider** — Boolean reserve for main button; affects StackFlowLayout padding
7. **OverlayLayer** — ToastContainer
8. **WebappAuthRefresh** — Token refresh + referral attach (side-effect; renders null)
9. **Suspense** — Fallback for lazy routes/layouts; uses TelegramLoadingScreen
10. **BootstrapController** — Auth, session, onboarding gate; blocks until app_ready or onboarding phase
11. **Routes** — StackFlowLayout (stack) and TabbedShellLayout (tabbed)

## File roles

| File | Role |
|------|------|
| `AppShell.tsx` | Root composition: providers + routes |
| `routes.tsx` | Route tree (AppRoutes) |
| `AppRoot.tsx` | Telegram runtime init |
| `AppErrorBoundary.tsx` | React error containment; fallback UI on render/lifecycle errors |
| `ViewportLayout.tsx` | StackFlowLayout |
| `SafeAreaLayer.tsx` | Safe-area container (values from TelegramProvider) |
| `OverlayLayer.tsx` | Toast layer |
| `TelegramLoadingScreen.tsx` | Suspense fallback |
| `TelegramEventManager.tsx` | Telegram event bridge |
| `WebappAuthRefresh.tsx` | Token refresh, referral attach |

## Bootstrap module

`bootstrap/` (sibling to `app/`) owns auth, session, and onboarding flow. BootstrapController imports from bootstrap and is composed inside AppShell.

## Responsive audit contract

- Use `docs/design-system/responsive-matrix.md` as the canonical breakpoint and surface matrix.
- Use `docs/design-system/responsive-audit-ledger.md` to record viewport-specific findings and fixes.
- Keep Playwright responsive coverage and Storybook viewport presets aligned with the same matrix values.
