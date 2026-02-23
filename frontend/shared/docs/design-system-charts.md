# Chart styling (design system)

Charts in Admin (ECharts via `echarts-for-react`) should use design tokens so they respect theme and stay consistent.

## Tokens

| Token | Use |
|-------|-----|
| `--chart-axis-font-size` | Axis labels (11px per design ref) |
| `--chart-grid` | Grid lines |
| `--chart-tooltip-bg` | Tooltip background |
| `--chart-tooltip-border` | Tooltip border |
| `--chart-series-1` … `--chart-series-4` | Series stroke/fill (primary, neutrals) |

## Rules

- Axis font size: `var(--chart-axis-font-size)`.
- Grid: horizontal only by default; color `var(--chart-grid)`.
- Tooltip: background `var(--chart-tooltip-bg)`, border `var(--chart-tooltip-border)`.
- Series colors: use `--chart-series-1` (primary), then 2–4 for multi-series.
- No hardcoded hex/rgb in chart components; use `--chart-*` tokens (fallback to existing `--color-*` semantics only when tokens are missing).
- Time zone: default UTC for telemetry (axis + tooltip title must be explicit).
