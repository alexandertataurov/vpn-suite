# Telegram Mini-App Design System

This design system defines a single, reusable UI contract for the mini-app across iOS, Android, and Desktop Telegram clients.

## Design System Rules

- **No inline styles** — Use design tokens, utility classes, or primitive/component classes only.
- **No hardcoded values** — No raw `px`, `#hex`, or `rgba()` in component CSS; use `var(--token)` from [`src/design-system/tokens`](src/design-system/tokens).
- **No duplicated components** — One Button (variant + tone), one Card (MissionCard), one Typography set (Display, H1, Body, Caption).
- **No stub or mock UI in production** — Use loading/empty/error states and real props.
- **Layout via primitives/layouts** — Use `Stack`, `Box`, `PageSection`, `HeaderZone`, etc.; avoid raw `div` + one-off layout classes.

**Lint / CI (recommended):** Disallow `style` prop in components (e.g. `react/forbid-component-props`); disallow hardcoded px/hex in CSS (stylelint rule or token-only policy).

## Layout Architecture

```text
AppRoot
└ SafeAreaLayer
  └ ViewportLayout
    ├ HeaderZone
    ├ ScrollZone
    └ ActionZone
```

Rules:
- `HeaderZone` never scrolls.
- `ScrollZone` is the only scroll container.
- `ActionZone` stays fixed at the bottom.
- Safe-area variables (`--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right`) and `--ds-safe-*` are applied at root/shell. Use them for padding; do not place interactive content in gesture zones.

## Safe Areas (Telegram Mini-App)

- **Tokens**: `--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right` (set from Telegram or `env(safe-area-inset-*)`). Aliases: `--ds-safe-top`, etc. in [`src/design-system/styles/telegram-miniapp-design-system.css`](src/design-system/styles/telegram-miniapp-design-system.css).
- **Usage**: Page padding and action zone use `calc(var(--safe-bottom) + var(--ds-space-2))` (or `--miniapp-safe-bottom-extra`); header uses `var(--miniapp-header-safe-top)`.
- Do not render UI under the Telegram header, bottom bar, or system gesture areas.

## Touch Targets

- Minimum **48×48px** for all interactive elements (buttons, list rows, tabs). Token: `--ds-touch-target-min`, `--ds-button-height` (48px).
- Buttons use `size="lg"` for miniapp to meet 48px height.

## Spacing System (8px Grid)

Defined in [`src/design-system/styles/telegram-miniapp-design-system.css`](src/design-system/styles/telegram-miniapp-design-system.css) and [`src/design-system/tokens/spacing.ts`](src/design-system/tokens/spacing.ts):

- `--ds-space-1`: 8px … `--ds-space-6`: 48px
- Page padding: `--ds-page-padding` (16px)
- Section spacing: `--ds-section-gap` (24px)
- Card padding: `--ds-card-padding` (16px)
- Button height: `--ds-button-height` (48px)

## Tokens (Single Source)

- **CSS entry**: [`src/design-system/styles/index.css`](src/design-system/styles/index.css) — single design-system styles entry (imports token files then miniapp.css). Loaded in [`main.tsx`](src/main.tsx). Tokens: miniapp-tokens.css, telegram-miniapp-design-system.css, miniapp-palette.css, miniapp-primitives-aliases.css.
- **Governance**: [`src/design-system/tokens`](src/design-system/tokens) (colors, spacing, typography, radius, shadows, zIndex). Components must use semantic tokens only.

## Typography

Single set: `Display`, `H1`, `H2`, `H3`, `Body`, `Caption` from `src/design-system/components/Typography.tsx`. Re-exported from `@/design-system`.

Class equivalents: `.ds-page-title`, `.ds-section-title`, `.ds-body-text`, `.ds-caption` (see telegram-miniapp-design-system.css).

## Button System

- **Single component**: `Button` from `@/design-system` with `variant="primary" | "secondary" | "ghost" | "danger"`, optional `tone="default" | "warning" | "danger"` (primary only), `size="sm" | "md" | "lg"`.
- **Miniapp usage**: `MissionPrimaryButton` and `MissionSecondaryButton` in [`src/design-system/patterns/MissionPrimitives.tsx`](src/design-system/patterns/MissionPrimitives.tsx) are thin wrappers around `Button` (variant primary/secondary, size lg).
- Rules: Height 48px; min tap target 48×48; full width via `fullWidth` for action zones.

## Card System

- **Single pattern**: `MissionCard` (tone, glowTone, chip slot) in [`src/design-system/patterns/MissionPrimitives.tsx`](src/design-system/patterns/MissionPrimitives.tsx). Exported as `Card` from `@/design-system`.
- Rules: 16px padding; flat style; rounded corners; use tokens for borders/surfaces.

## Design System Folder Structure

All miniapp UI should be imported from `@/design-system` only. Prefer `import { X } from '@/design-system'`; use `@/design-system/ui` or `@/design-system/components` only when tree-shaking or circular deps require it.

```text
src/design-system/
  tokens/          # TS token definitions (governance)
  primitives/      # Box, Stack, Container, Panel, Text, Heading, Divider, Inline (+ typography/Text, Heading)
  components/      # buttons/, forms/, feedback/, display/, Typography, TelegramThemeBridge; Card from patterns
  layouts/         # PageSection, PageFrame, PageHeader, PageScaffold, HeaderZone, ScrollZone, ActionZone
  patterns/        # MissionPrimitives, FallbackScreen, SessionMissing, Home*, OfflineBanner, DangerZone, …
  theme/           # ThemeProvider, useTheme
  ui/              # Re-export barrel only (primitives + components); prefer @/design-system
  index.ts         # Barrel
```

ViewportLayout and MiniappLayout live in `src/app/ViewportLayout`; import from `@/app/ViewportLayout` when needed (e.g. Storybook). App shell imports zones from `@/design-system`.

## Public API (import from `@/design-system`)

- **Tokens / theme**: tokens, `ThemeProvider`, `useTheme`
- **Typography**: `Display`, `H1`, `H2`, `H3`, `Body`, `Caption`
- **Components**: `Button`, `Card` (MissionCard), `Input`, `InlineAlert`, `Skeleton`, `ConfirmModal`, `ToastContainer`, `ProgressBar`
- **Layouts**: `PageSection`, `PageFrame`, `PageHeader`, `PageScaffold`, `HeaderZone`, `ScrollZone`, `ActionZone`
- **Primitives**: `Box`, `Stack`, `Container`, `Panel`, `Text`, `Heading`, `Divider`, `Inline`
- **Patterns**: `MissionCard`, `MissionChip`, `MissionPrimaryButton`, `MissionSecondaryButton`, `MissionProgressBar`, `FallbackScreen`, `SessionMissing`, `HomeHeroPanel`, `HomeQuickActionGrid`, `HomeDynamicBlock`, `OfflineBanner`, `TroubleshooterStep`, `DangerZone`
- **Other**: `TelegramThemeBridge`, icons (e.g. `IconShield`)

## Motion

- Use opacity, scale, translate only; avoid heavy transforms or expensive blur.
- Animations in miniapp.css (e.g. fadeup) use opacity + translateY.

## Usage

Import from the design system only:

```ts
import {
  Button,
  Card,
  H2,
  Body,
  Stack,
  PageSection,
  PageFrame,
  HeaderZone,
  ScrollZone,
  ActionZone,
  MissionPrimaryButton,
  MissionCard,
} from "@/design-system";
```
