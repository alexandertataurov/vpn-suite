# Telegram Mini-App Design System

This design system defines a single, reusable UI contract for the mini-app across iOS, Android, and Desktop Telegram clients.

## Layout Architecture

```text
AppRoot
└ SafeAreaLayer
  └ ViewportLayout
    ├ HeaderZone
    ├ ScrollZone
    └ ActionZone
```

Runtime event ownership:
- `TelegramProvider` mounts a single `TelegramEventManager` that bridges Telegram WebApp events to app hooks.

Rules:
- `HeaderZone` never scrolls.
- `ScrollZone` is the only scroll container.
- `ActionZone` stays fixed at the bottom.
- Safe-area variables (`--safe-*`) are applied at root/shell.

## Spacing System (8px Grid)

Defined in [`src/styles/telegram-miniapp-design-system.css`](src/styles/telegram-miniapp-design-system.css):

- `--ds-space-1`: 8px
- `--ds-space-2`: 16px
- `--ds-space-3`: 24px
- `--ds-space-4`: 32px
- `--ds-space-5`: 40px
- `--ds-space-6`: 48px

Usage:
- Page padding: `--ds-page-padding` (16px)
- Section spacing: `--ds-section-gap` (24px)
- Card padding: `--ds-card-padding` (16px)
- Button height: `--ds-button-height` (48px)

## Typography

Reusable styles:
- `PageTitle` (`.ds-page-title`) — 22px / 600
- `SectionTitle` (`.ds-section-title`) — 18px / 600
- `CardTitle` (`.ds-card-title`) — 16px / 600
- `BodyText` (`.ds-body-text`) — 14px / 400
- `Caption` (`.ds-caption`) — 12px / 400
- `Label` (`.ds-label`) — 12px / 600

Component file: [`src/components/ui/Typography.tsx`](src/components/ui/Typography.tsx)

## Button System

Variants:
- `PrimaryButton`
- `SecondaryButton`
- `GhostButton`
- `DangerButton`

Rules:
- Height 48px.
- Minimum tap target 48×48.
- `PrimaryButton` supports full width (`fullWidth`) for action zones.
- 8px spacing in button groups (`ButtonStack`).

Component file: [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx)

## Card System

Structure:
- `Card`
- `CardHeader`
- `CardContent`
- `CardFooter`

Rules:
- 16px padding.
- 24px section/card rhythm.
- Flat visual style, minimal/no shadow, rounded corners.

Component file: [`src/components/ui/Card.tsx`](src/components/ui/Card.tsx)

## List Components

Reusable pieces:
- `ListItem`
- `DeviceTile`
- `SettingsRow`
- `StatRow`

Rules:
- Minimum row height 48px.
- Row padding 12–16px.
- Icon zone 24px.

Files:
- [`src/components/ui/List.tsx`](src/components/ui/List.tsx)
- [`src/components/display/DeviceTile.tsx`](src/components/display/DeviceTile.tsx)

## Header and Navigation

- Header zone uses a 56px base height with safe top inset.
- `BackButton` and `Tabs` are reusable navigation primitives.
- Header title is single-line truncated by default.

Files:
- [`src/components/navigation/BackButton.tsx`](src/components/navigation/BackButton.tsx)
- [`src/components/navigation/Tabs.tsx`](src/components/navigation/Tabs.tsx)

## Bottom Action Area

- Action zone height: 72–96px.
- Bottom padding: safe area + 16px.
- Runtime safety buffer: actions keep at least `safe-bottom + 20px` from the physical screen edge.
- Primary actions should be thumb-reachable and use full-width buttons where possible.

Files:
- [`src/layout/ActionZone.tsx`](src/layout/ActionZone.tsx)
- [`src/styles/telegram-miniapp-design-system.css`](src/styles/telegram-miniapp-design-system.css)

## Theme Integration

Telegram variables are mapped with fallbacks:
- `--tg-theme-bg-color`
- `--tg-theme-text-color`
- `--tg-theme-hint-color`
- `--tg-theme-button-color`

Bridge implementation:
- [`src/components/TelegramThemeBridge.tsx`](src/components/TelegramThemeBridge.tsx)

The bridge updates:
- `data-tg` flag
- `--tg-theme-*` CSS vars from `WebApp.themeParams`
- app theme mode (`consumer-dark` / `consumer-light`) from Telegram color scheme

## Component Folder Structure

```text
src/components/
  layout/
    AppRoot.tsx
    SafeAreaLayer.tsx
    ViewportLayout.tsx
    HeaderZone.tsx
    ScrollZone.tsx
    ActionZone.tsx
  ui/
    Button.tsx
    Card.tsx
    List.tsx
    Section.tsx
    Divider.tsx
    Typography.tsx
  display/
    StatCard.tsx
    DeviceTile.tsx
    StatusBadge.tsx
  navigation/
    Tabs.tsx
    BackButton.tsx
  feedback/
    Toast.tsx
    Loader.tsx
    EmptyState.tsx
```

Canonical runtime ownership:

```text
src/app/
  AppRoot.tsx
  SafeAreaLayer.tsx
  ViewportLayout.tsx
  TelegramEventManager.tsx

src/telegram/
  telegramClient.ts
  telegramEvents.ts
```

`src/layouts/MiniappLayout.tsx` is a backward-compatible re-export shim to `src/app/ViewportLayout.tsx`.

## Accessibility

- Minimum tap target: 48×48.
- Icon-only controls require labels (`aria-label`).
- Text and hint colors derive from Telegram-aware tokens.
- Motion feedback is subtle (press scale + color change).
- Nested vertical scrolling is not allowed; only `ScrollZone` may scroll on Y-axis.

## Usage

Import all DS primitives via:

```ts
import * as TelegramDesignSystem from "@/components";
```

or direct group imports:

```ts
import { PrimaryButton, Card, PageTitle } from "@/components/design-system";
```
