# Typography tokens — Tailwind mapping

Typography tokens are defined in:

- Admin: `frontend/admin/src/design-system/tokens/tokens.css` + `frontend/admin/src/design-system/typography.css`
- Miniapp: `frontend/miniapp/src/design-system/styles/tokens/base.css`, `theme/consumer.css`

## Tailwind → token mapping

| Tailwind utility | Token |
|------------------|--------|
| `font-sans` | `--font-sans` |
| `font-mono` | `--font-mono` |
| `text-xs` | `--font-size-xs`, `--line-height-normal` |
| `text-sm` | `--font-size-sm`, `--line-height-normal` |
| `text-base` | `--font-size-base`, `--line-height-normal` |
| `text-lg` | `--font-size-lg`, `--line-height-relaxed` |
| `text-xl` | `--font-size-xl`, `--line-height-snug` |
| `text-2xl` | `--font-size-2xl`, `--line-height-snug` |
| `text-3xl` | `--font-size-3xl`, `--line-height-tight` |
| `leading-tight` | `--line-height-tight` |
| `leading-snug` | `--line-height-snug` |
| `leading-normal` | `--line-height-normal` |
| `leading-relaxed` | `--line-height-relaxed` |
| `font-normal` | `--font-weight-normal` (400) |
| `font-medium` | `--font-weight-medium` (500) |
| `font-semibold` | `--font-weight-semibold` (600) |
| `font-bold` | `--font-weight-bold` (700) |
| `tracking-tight` | `--letter-spacing-tight` |
| `tracking-normal` | `--letter-spacing-normal` |

Composite styles (e.g. headings) remain in CSS as `font: var(--text-h1);` etc. Use typography primitives (Text, Heading) for semantic consistency.

## Definition of done (typography overhaul)

- Admin typography primitives live under `frontend/admin/src/design-system/` (e.g. `typography.tsx` + primitives).
- Styleguide (`/styleguide`) documents all primitives with live examples.
- Admin pages use primitives for page titles (PageHeader/Heading), section titles (Heading), body/muted/code (Text, CodeText), labels and errors (Label, HelperText), and metrics where applicable (Stat).
- Tables use a single header/cell typography standard (font-size sm, line-height normal, header weight 600); tabular-nums available via `.table-cell-numeric`.
- No one-off pixel sizes (e.g. `text-[11px]`); use token sizes (e.g. `text-xs`, `text-sm`).
- Operator screens (Servers list, Server detail, Peers, Issue Config modal, Audit) use primitives and are scannable with clear hierarchy.
