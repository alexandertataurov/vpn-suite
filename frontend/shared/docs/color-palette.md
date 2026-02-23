# Color Palette — VPN Suite Design System

Tokens are defined in `tokens/colors.json` and compiled to `src/theme/tokens.css`. Colors use **OKLCH** for perceptual uniformity.

## Primitive scales (OKLCH)

Use for composition only; prefer semantic tokens in UI.

- **Gray:** `--color-gray-50` … `--color-gray-950`
- **Primary:** `--color-primary-50` … `--color-primary-950` (e.g. 400, 500, 600 for UI)
- **Status:** `--color-success-500/600`, `--color-warning-500/600`, `--color-error-500/600`, `--color-info-500/600`

## Semantic tokens (use these)

- **Background:** `--color-background-primary`, `--color-background-secondary`, `--color-background-tertiary`, `--color-background-inverse`, `--color-background-overlay`, `--color-scrim`
- **Text:** `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-text-inverse`
- **Border:** `--color-border-subtle`, `--color-border-default`, `--color-border-strong`
- **Interactive:** `--color-interactive-default`, `--color-interactive-hover`, `--color-interactive-active`, `--color-interactive-disabled`
- **Focus:** `--color-focus-ring`
- **On primary:** `--color-on-primary`
- **Status:** `--color-success`, `--color-warning`, `--color-error`, `--color-info`, `--color-connected`, `--color-syncing`

## Themes

- **Dark** (default): `html` or `html[data-theme="dark"]`
- **Light:** `html[data-theme="light"]`
- **Dim:** `html[data-theme="dim"]` (softer dark)

## Accessibility

- **WCAG 2.2 AA:** Text/background pairs meet 4.5:1 (normal) and 3:1 (large/UI). Focus ring at least 3:1.
- **High contrast:** `@media (prefers-contrast: high)` overrides text for stronger contrast.
- **Forced colors:** `@media (forced-colors: active)` maps to system Canvas, CanvasText, LinkText.
- Do not rely on color alone for information (use icons/labels).

## Contrast

Semantic tokens are chosen to pass contrast checks. Validate new pairings with a contrast tool.
