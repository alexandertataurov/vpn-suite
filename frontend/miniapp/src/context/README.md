# Context layer

Shared reactive state for the miniapp. Domain-scoped providers.

## Provider hierarchy (outer → inner)

1. **TelegramProvider** — side-effect only: sets `data-tg*` and viewport CSS vars
2. **MainButtonReserveProvider** — reserves space for Telegram main button (`reserve`, `setReserve`)
3. **BootstrapController** (BootstrapContext) — phase, onboarding; lives in `bootstrap/`
4. **LayoutProvider** — `stackFlow` for tabbed vs stack layout; inside route layouts

## Conventions

- **Throw when outside provider.** Hooks `useLayoutContext`, `useMainButtonReserve`, `useBootstrapContext` throw if used outside their provider. No silent defaults.
- **Use context for truly shared layout/platform state.** Server state → React Query. Auth token → `api/client` module. Ephemeral UI → local state.
- **Keep values small.** Memoize provider values; avoid large objects that cause broad re-renders.
