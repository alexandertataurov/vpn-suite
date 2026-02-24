# Button Migration Plan

## Completed

1. **QrPanel** — Raw `btn btn-ghost btn-sm` → `Button variant="ghost" size="sm"`
2. **AuthGuard** — Raw `btn btn-primary` → `Button`
3. **Users.tsx** — `data-table-action-btn` → `Button` / `ButtonLink` with `size="icon"` `variant="ghost"`
4. **Per-page overrides removed** — `.admin-main .btn-primary`, `.miniapp-main .btn-primary`, `.login-btn`

## In Progress / Remaining

### Fix asChild (now implemented)

Settings uses `Button asChild` with `Link`. The Button now supports `asChild` via Radix Slot — no change needed; it should work.

### Per-page CSS overrides (remove after validation)

| File | Override | Action |
|------|----------|--------|
| `admin.css` | `.admin-main .btn-primary { border-radius }` | Remove; use token or accept default |
| `admin.css` | `.admin-sidebar-footer .btn { padding }` | Remove or move to layout-specific token |
| `admin.css` | `.login-btn { margin-top }` | Use layout wrapper instead of className |
| `miniapp.css` | `.miniapp-main .btn-primary { border-radius }` | Same as admin-main |

### Legacy raw buttons (documented exceptions)

| Location | Type | Recommendation |
|----------|------|----------------|
| AdminLayout | `admin-menu-btn` | Keep (hamburger; different semantics) or migrate to `Button variant="ghost" size="icon"` |
| Billing, Telemetry | `telemetry-tab`, tab buttons | Keep; use shared Tabs component |
| Tabs.tsx | `ref-tab` | Shared component; tab semantics |
| Users.tsx | `data-table-action-btn` | Migrate to `Button variant="ghost" size="icon"` + aria-label |
| Servers.tsx | `ref-preset-btn` | Migrate to `Button variant="secondary"` (toggle) |
| DropdownMenu | `btn btn-ghost btn-sm` on items | Keep (menu item styling) or align with Button |

### Migration order

1. Run full build and tests.
2. Remove per-page overrides one at a time; verify UI.
3. Migrate `data-table-action-btn` to Button.
4. Migrate ref-preset-btn.
5. Optionally migrate admin-menu-btn.
