# Design ref → token mapping

When porting from `_design_ref/` (Figma/Tailwind), translate to tokens and shared components. Do **not** copy-paste Tailwind classes or inline hex into admin/miniapp.

| Ref (Tailwind / hex) | Token / usage |
|----------------------|----------------|
| `text-neutral-500`, `text-neutral-600` | `--color-text-secondary`, `--color-text-tertiary`, `--color-neutral-500` |
| `bg-neutral-100`, `border-neutral-200` | `--color-neutral-100`, `--border-subtle`, `--color-border-default` |
| `rounded-lg` | `--radius-lg` |
| `p-12`, `gap-8` | `--spacing-12`, `--spacing-8` (4px grid) |
| `text-2xl`, `text-sm`, `text-xs` | `--text-2xl`, `--text-sm`, `--text-xs` (brief scale in tokens.css) |
| Chart axis 11px | `--chart-axis-font-size` |
| Chart grid #f5f5f5 | `--chart-grid` |
| Primary / ink | `--color-primary`, `--color-interactive-default` |
| Muted text/bg | `--muted`, `--muted-foreground` (aliases) |
| Sidebar bg/border | `--sidebar`, `--sidebar-border` |
| Input background | `--input-background` |

**Rules:** No Tailwind class names in admin/miniapp. No hex/rgb in component CSS; use `--color-*` or semantic tokens. Use shared Button, Input, Select, Panel, Table, etc.
