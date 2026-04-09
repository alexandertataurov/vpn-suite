# UI Alignment Decision Log

Single-page record of decisions for frontend UI/design alignment across admin and miniapp.

## Theme model

| App | Allowed themes | Storage key | Default |
|-----|----------------|-------------|---------|
| Admin | `dark`, `dim`, `light` | `vpn-suite-admin-theme` | `dark` |
| Miniapp | `consumer-light`, `consumer-dark` | `vpn-suite-miniapp-theme` | `consumer-light` |

- **Admin**: operator-grade; uses `data-console="operator"` for layout-specific overrides.
- **Miniapp**: consumer brand; same semantic token names (`--color-bg`, `--color-text`, `--color-accent`, etc.) with different values per theme.
- Theme is applied via `ThemeProvider` from `@vpn-suite/shared/theme`; both apps mount it in `main.tsx` with the props above.

## Component adoption rules

- **Add to shared** when: used in more than one app, or it is a generic form/feedback/layout primitive (Button, Input, Table, Modal, etc.).
- **Keep app-local** when: feature-specific and only used in one app (e.g. ServerRow, MetricTile, FilterBar in admin).
- **New primitives**: must use semantic tokens only, have Storybook stories with title + description, and be listed in `component-inventory.md` and (if applicable) `tokens-map.ts` → `COMPONENT_TOKENS`.

## Deprecation policy

- **Legacy tokens/aliases**: Kept in `tokens.css` as aliases during migration only; do not add new usages. Remove aliases when no grep hits remain across `apps/admin-web`, `apps/miniapp`, and `apps/shared-web`.
- **Deprecated CSS classes** (e.g. `ref-action-btn`, `dashboard-muted`): Document in [ui-guide.md](ui-guide.md) under "Don't"; replace with shared components or token-based classes. No deadline; remove when the last usage is migrated.
- **New code**: must not introduce legacy tokens or deprecated classes.
