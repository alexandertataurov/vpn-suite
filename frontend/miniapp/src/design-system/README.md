# Miniapp design system

Single entry for layout, patterns, components, primitives, tokens, theme, and icons. Import from `@/design-system`.

## Content Library (page content source of truth)

**Scrollable page content** (everything inside `.page`) is specified in **[vpn_content_lib.md](./vpn_content_lib.md)**. That document is the canonical reference for:

- Page composition (Page Header → Hero → Section Divider → Content Cards)
- Class names (e.g. `.page-hd`, `.shead`, `.shead-lbl`, `.shead-rule`, `.op`, `.data-grid`, `.btn-primary`). CSS keeps `.shead-label`/`.shead-line` as aliases for `.shead-lbl`/`.shead-rule`.
- Progress: Content Library §8 uses `.bar-track`/`.bar-fill` (`.ok`/`.warn`/`.crit`/`.info`) in content-library.css. Legacy: `.h-track`, `.h-fill`, `.h-fill.pct-*` (0–100) in miniapp.css. Prefer ProgressBar component or `.bar-track`/`.bar-fill` for new code.
- Error vs danger: Semantic token is `--color-error`; `--danger`, `.btn-danger`, and LEGACY_ALIASES use "danger" as the legacy name for the same semantic (see tokens/colors.ts).
- Buttons: Prefer the `Button` component and `getButtonClassName()` from `@/design-system` for consistency and theming. Raw `.btn`, `.btn-primary`, etc. in miniapp.css are legacy; migrate over time.
- Token usage (`--ui`, `--mono`, `--s1`–`--s4`, `--bd-def`, `--tx-pri`, etc.)
- Content-level constraints (Section 18)

CSS for content lives in `styles/content-library.css` and `styles/miniapp.css`; load order is `styles/index.css` → tokens → telegram DS → palette → primitives-aliases → miniapp.css → content-library.css.

## Conventions

- **Z-index:** Single source for shell: `theme/z-index.ts` (Z_HEADER, Z_NAV = 200) and `miniapp.css` `:root` (`--z-header`, `--z-nav`). Use `var(--z-*)` in CSS. `miniapp-tokens.css` / `miniapp-theme-consumer.css` set 180/210 in some theme blocks but are overridden by miniapp.css.
- **Inline vs Stack:** Prefer `Inline` for horizontal layouts (gap/align/wrap); `Stack direction="horizontal"` is equivalent — use one consistently.
- **Spacing tokens:** Primary scale is `--spacing-1`…`--spacing-16` (tokens/spacing.ts). Legacy aliases: `--sp-*` and `--ds-space-*` in miniapp-primitives-aliases.css.

## Structure

- **tokens/** — colors, spacing, radius, typography, shadows, zIndex
- **theme/** — ThemeProvider, tokens-map, z-index constants
- **primitives/** — Box, Stack, Container, Panel, Heading, Text, Divider, Inline
- **components/** — Typography, Button, forms, feedback, display
- **patterns/** — Mission*, Home*, DangerZone, ListCard, DataGrid, etc.
- **layouts/** — PageScaffold, PageHeader, PageSection
- **styles/** — CSS entry and token/component styles
