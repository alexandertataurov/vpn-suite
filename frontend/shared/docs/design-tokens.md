# Design Tokens — VPN Suite Design System

Single source of truth for colors, spacing, typography, and depth. Tokens are defined in **JSON** under `tokens/` and compiled to `src/theme/tokens.css`. New products import `@vpn-suite/shared` and may override CSS variables for branding.

## Source and build

- **Sources:** `tokens/colors.json`, `tokens/typography.json`, `tokens/spacing.json`, `tokens/effects.json`
- **Output:** `src/theme/tokens.css` (do not edit by hand)
- **Build:** From `frontend/shared`, run `npm run tokens`

## Documentation

- **[color-palette.md](color-palette.md)** — OKLCH primitives, semantic tokens, themes (dark/light/dim), accessibility
- **[typography-specimen.md](typography-specimen.md)** — Font stacks, fluid type scale, text styles, loading strategy
- **[design-tokens-migration.md](design-tokens-migration.md)** — Old → new token mapping, breaking changes

## Quick reference

- **Colors:** Semantic tokens `--color-background-primary`, `--color-text-primary`, `--color-interactive-default`, etc. Compatibility aliases: `--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, etc.
- **Spacing:** `--spacing-0` … `--spacing-64`, plus `--spacing-xs` (4px), `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`
- **Typography:** Fluid `--font-size-xs` … `--font-size-5xl`, composite `--text-h1` … `--text-body`, `--text-button`, etc.
- **Effects:** `--shadow-*`, `--radius-*`, `--duration-*`, `--ease-*`, `--blur-*`, `--opacity-*`, `--icon-size-*`

## Primitives and tokens

Which tokens each shared UI primitive uses (for audit and overrides):

- **Button:** spacing (padding), radius (`--radius-button` / md), typography (`--text-button`), colors (`--color-interactive-*`), shadow (optional). Classes: `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `btn-sm` / `btn-md` / `btn-lg`.
- **PrimitiveBadge:** spacing, radius (pill), typography (caption/sm), semantic colors. Classes: `ds-badge` with `data-variant`.
- **Panel:** spacing, radius (`--radius-card` / xl), shadow, colors (surface/background). Classes: `card`, `card-glass`, `card-raised`.
- **Section pattern:** spacing (`--spacing-*` for head/body gap), typography (title). Classes: `ref-section`, `ref-section-head`, `ref-section-body`.
- **Table:** spacing (cell padding), typography (bodySm), colors (border, text), radius. Classes: `table-wrap`, `table`, `table-empty`, `table-cell-checkbox`, `table-sort`, `table-cell-truncate`, `table-cell-numeric`, `table-cell-mono`, `table-cell-actions`. See [Table Style Contract](#table-style-contract) below.

### Table Style Contract

Single source of truth for table cell alignment, typography, and overflow across admin tables:

- **Row height:** comfortable = 48px min (spacing-3 y); compact = 40px (spacing-2 y)
- **Cell padding:** x = spacing-4, y = spacing-3 (comfortable); spacing-2 (compact)
- **Typography:** header = font-size-sm, font-weight-600, color-text-secondary; body = font-size-sm, line-height-normal
- **Alignment:** text = left + vertical-align middle; numeric = right + tabular-nums; actions = right + fixed width
- **Overflow:** IDs = monospace + truncate + title tooltip; names/emails = truncate + title; Details/JSON = "View" → drawer
- **table-layout:** fixed (predictable truncation)
- **Sticky header:** yes (already in .table)
- **Modal:** spacing, radius, shadow (lg), colors (overlay, surface), layout (`--layout-maxWidthModal`). Classes: `modal-overlay`, `modal`, `modal-header`, `modal-body`, `modal-footer`, `modal-close`, `modal-message`, `modal-field`, `modal-input`.
- **Skeleton:** colors (muted), radius, animation (duration/ease). Classes: `skeleton`, `skeleton-line`, etc.
- **EmptyState / ErrorState:** spacing, typography (body, caption), colors (text secondary). Use semantic text and background tokens.
- **Input / Select / Field:** spacing (componentPadding), radius, border, typography, colors. Use `--color-border-*`, `--color-text-*`, `--color-interactive-*`.

All primitives should use CSS variables from tokens (no hardcoded hex/rgb in component styles). Use `cn()` to merge `className` for overrides.

## Theme switch

Set `data-theme="light"`, `data-theme="dark"`, or `data-theme="dim"` on `<html>`. Default is dark. Use ThemeProvider from `@vpn-suite/shared` and the inline script in index.html to avoid FOUC.

## Overriding for a new product

```css
@import "@vpn-suite/shared/theme/tokens.css";

[data-theme="light"] {
  --color-interactive-default: oklch(0.5 0.2 260);
  --color-interactive-hover: oklch(0.6 0.2 260);
}
```

Use semantic tokens when overriding; shared components pick up the variables.
