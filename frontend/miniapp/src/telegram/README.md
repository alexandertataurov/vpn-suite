# Telegram Platform Integration

Boundary layer for Telegram WebApp runtime. Single source for all `window.Telegram` access.

## Layers

- **telegram.types.ts** — Type definitions and `TELEGRAM_EVENT_NAMES`. Source of truth for contracts.
- **telegramCoreClient** — Low-level access: `getWebApp()`, `onEvent()`, viewport, theme, init data. Only module touching `window.Telegram`.
- **telegramFeatureClient** — High-level features: clipboard, popup, cloud storage, QR scanner, payments. Wraps core.
- **telegramEvents** — Event fan-out bridge. `subscribeTelegramEvent` / `emitTelegramEvent`.
- **TelegramEventManager** — React component that bridges runtime events to `telegramEvents`. Mount once in app shell.

## Usage

- **Core APIs** — Use `telegramClient` (from `telegramCoreClient`): platform detection, viewport, theme, init data, buttons, haptics.
- **Features** — Use `telegramFeatureClient`: popup, clipboard, cloud storage, QR scanner, payments.
- **Events** — Use `subscribeTelegramEvent` or `useTelegramEvent`. Some events carry payloads (see `TelegramEventPayloadMap`).

## Boundary

The only allowed direct `window.Telegram` access outside this layer is the pre-React bootstrap in `index.html` for theme/attribute setup. See comment in `index.html`.
