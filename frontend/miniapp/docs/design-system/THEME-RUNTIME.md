# Miniapp Theme Runtime

**Single source:** `consumer-light` | `consumer-dark`

## Runtime Theme

The miniapp uses exactly two themes at runtime:

| Theme | data-theme | Usage |
|-------|------------|-------|
| consumer-dark | `consumer-dark` | Default. Telegram dark, Stripe/Linear dark palette. |
| consumer-light | `consumer-light` | Light mode. Apple/Stripe light palette. |

## Load Order

1. `tokens/base.css` — Primitives (color scales), spacing, typography, motion, layout. Default semantic fallback (consumer-dark-like) for `html` when no theme set.
2. `theme/telegram.css` — Telegram-specific overrides.
3. `theme/consumer.css` — **Canonical** semantic tokens for `consumer-light` and `consumer-dark`.
4. `layout/zones.css` — Layout zones.
5. `shell/frame.css` — Shell, buttons, modals. Optional overrides scoped to consumer themes.
6. `content/library.css` — Content library classes.

## How Theme Is Applied

- `ThemeProvider` (main.tsx) sets `data-theme` on `<html>`.
- `themes={["consumer-dark", "consumer-light"]}`, `defaultTheme="consumer-dark"`.
- `TelegramThemeBridge` syncs from Telegram/OS to ThemeProvider.

## Amnezia overrides (consumer-light only)

`theme/amnezia.css` overrides consumer-light per `docs/frontend/design/amnezia-miniapp-design-guidelines.md`: warm gray bg, near-black primary button, no shadows. Amnezia does **not** apply when `data-theme="consumer-dark"`; the default theme uses consumer-dark, so Amnezia tokens are only active in light mode.

## Deprecated Themes

- `dark`, `light`, `dim` — Removed from base.css. Do not use.
- `starlink` — Admin/operator only. Isolated in base.css.
- `primitives` — Removed.

## Operator Console

`[data-console="operator"]` uses `consumer-light` / `consumer-dark` as parent. Fully isolated from consumer UI; no token leakage.
