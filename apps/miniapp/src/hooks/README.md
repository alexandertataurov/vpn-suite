# Hooks

Reusable React hooks for the miniapp. Explicit re-exports only (no `export *`).

## Structure

```
hooks/
├── index.ts              # Main public API
├── controls/             # Telegram UI controls (back button, main button, fullscreen)
├── features/             # Feature composition (payments, open link, modal, referral)
│   └── referral/         # Referral attach
├── system/               # Platform primitives (haptics, popup, cloud storage)
└── telegram/             # Telegram platform state (viewport, theme, init data)
```

## Categories

- **Root** — Generic hooks (session, API health, alerts, telemetry, viewport, pull-to-refresh). Import from `@/hooks`.
- **controls/** — Telegram back button, main button, fullscreen. Used by `useTelegramMainButton`, `useTelegramBackButtonController`.
- **telegram/** — `useTelegramApp`, `useTelegramInitData`, `useSafeAreaInsets`, `useViewport`, `useTelegramTheme`, `useTelegramEvent`.
- **features/** — `useOpenLink`, `usePayments`, `useConnectionStatus`, `useMiniAppNavigation`, `useModalManager`, `useReferralAttach`.
- **system/** — `useHaptics`, `usePopup`, `useCloudStorage`. Used internally by other hooks.

## Conventions

1. **Effect safety** — Async work must be cancellable or guarded with `mountedRef`. No module-level mutable state for per-component behavior.
2. **Return shape** — Object for 3+ values; tuple for 2. Callbacks wrapped in `useCallback` when identity matters.
3. **Global hooks** — Generic, reusable. No imports from `@/page-models` or feature modules.
4. **Feature hooks** — Live in `features/` or next to the feature (e.g. `page-models/useHeaderAlerts`).
5. **Telegram** — All Telegram APIs via `telegramClient`. Hooks in `telegram/` or `controls/`.

## Key hooks

| Hook | Purpose |
|------|---------|
| `useSession` | Session/me query (TanStack Query) |
| `useTelegramWebApp` | WebApp facade (initData, openLink) |
| `useTelegramMainButton` | Main button orchestration |
| `useUnifiedAlerts` | Unified bell list (offline, toasts, account signals) |
| `useWebappTokenRefresh` | Proactive token refresh |

## Imports

- Pages and page-models: `import { useSession, useTelegramMainButton } from "@/hooks"`.
- Telegram-specific: `import { useTelegramInitData } from "@/hooks/telegram"`.
- Feature-specific: `import { useReferralAttach } from "@/hooks/features/referral"`.
