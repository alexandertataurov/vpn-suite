# Theme token map — semantic colors and severity

Single source: `shared/src/theme/tokens.css`. Themes: `data-theme="dark" | "dim" | "light"` on `<html>`.

## Semantic colors (all themes)

| Token | Use |
|-------|-----|
| `--color-bg` | Page background |
| `--color-surface` | Cards, panels |
| `--color-text` | Primary text |
| `--color-text-muted` | Secondary text |
| `--color-text-tertiary` | Tertiary / hints |
| `--color-border` | Borders |
| `--color-focus-ring` | Focus outline (`:focus-visible`) |
| `--color-accent` | Links, primary actions |
| `--color-success` | Success state |
| `--color-warning` | Warning state |
| `--color-error` | Error / danger |

## Telemetry severity → color + icon

Use **color and icon** together (never color alone) for status.

| Severity | Color token | Icon (suggested) |
|----------|-------------|------------------|
| Healthy / OK | `--color-success` | Check / circle (success) |
| Warning | `--color-warning` | Warning triangle |
| Critical | `--color-error` | Alert / alert-circle |
| Unknown | `--color-text-tertiary` | Minus / circle-outline |

Use in: IncidentPanel, status badges, ChartFrame banners, HealthBadge, LiveStatusBlock.

## Fluid typography tokens

Defined in `shared/src/theme/breakpoints.css`:

| Token | Use |
|-------|-----|
| `--text-h1-fluid` | Page titles |
| `--text-h2-fluid` | Section titles |
| `--text-h3-fluid` | Subsections |
| `--text-body-fluid` | Body copy |
| `--text-table-fluid` | Table cell text (density) |

Example: `font-size: var(--text-h1-fluid);`
