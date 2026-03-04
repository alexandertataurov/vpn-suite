# Table Unification Audit

Date: 2026-02-21

**Status (2026-03):** legacy document. The admin app was refactored from `pages/*` + `frontend/shared/*` into `features/*` + `core/*` + `design-system/*`. Update any remaining references below accordingly.

## Inventory (Tables + Routes)

- Overview `/`
  - `frontend/admin/src/features/overview/OverviewPage.tsx`

- Telemetry `/telemetry`
  - `frontend/admin/src/features/telemetry/TelemetryPage.tsx`

- Control Plane `/automation`
  - `frontend/admin/src/features/automation/AutomationPage.tsx`
    - API: `Table` + `Column<T>`
    - Features: numeric, truncate
    - Sorting: none
    - Pagination: none
    - Selection: none
    - Custom CSS: none beyond shared
    - Performance: moderate rows (unknown)

- Servers `/servers`
  - `frontend/admin/src/features/servers/ServersPage.tsx`
    - API: manual `<table>` inside `TableContainer` (custom row via `ServerRow`)
    - Features: selection (checkbox), density toggle, row click, actions, numeric cells
    - Sorting: external control (FilterBar, not table header)
    - Pagination: `Pagination`
    - Custom CSS: `.data-table-row`, stale/snapshot stale classes, table density class
    - Performance: tanstack virtualizer when `visibleItems.length > 200`

- Server Detail `/servers/:id`
  - (no longer present in current admin router; previously `frontend/admin/src/pages/ServerDetail.tsx`)
    - API: `Table` + `Column<T>`
    - Features: truncation, numeric
    - Sorting: none
    - Pagination: none
    - Selection: none
    - Custom CSS: none beyond shared
    - Performance: moderate rows (unknown)

- Users `/users`
  - `frontend/admin/src/features/users/UsersPage.tsx`
    - API: `VirtualTable` + `Column<T>`
    - Features: sorting, actions, compound user cell, secondary text, virtualization
    - Sorting: `Table` built-in sort UI via `sortKey` + `onSort`
    - Pagination: `Pagination`
    - Selection: none
    - Custom CSS: shared `.table-*` utilities
    - Performance: tanstack virtualizer (via `VirtualTable`), maxHeight at 480px for >50 rows

- User Detail `/users/:id`
  - (no longer present in current admin router; previously `frontend/admin/src/pages/UserDetail.tsx`)
    - API: no table; uses `.table-empty` for empty notices
    - Custom CSS: uses shared `.table-empty`

- Devices `/devices`
  - `frontend/admin/src/features/devices/DevicesPage.tsx`
    - API: `Table` + `Column<T>` inside `TableSection`
    - Features: selection (checkbox), truncation, mono, numeric, actions
    - Sorting: none
    - Pagination: `TableSection` pagination
    - Custom CSS: none beyond shared
    - Performance: moderate rows (limit 20, higher for region filter)

- Audit `/audit`
  - `frontend/admin/src/features/audit/AuditPage.tsx`
    - API: `Table` + `Column<T>` inside `TableSection`
    - Features: truncate
    - Sorting: none
    - Pagination: `TableSection` pagination
    - Custom CSS: none beyond shared
    - Performance: moderate rows

- Billing `/billing`
  - `frontend/admin/src/features/billing/BillingPage.tsx`
  - `/payments` and `/subscriptions` redirect to `/billing?tab=payments` and `/billing?tab=subscriptions`

## Table-Related Shared Components

- `frontend/admin/src/design-system/primitives/DataTable.tsx`
- `frontend/admin/src/design-system/primitives/Table.tsx`
- `frontend/admin/src/design-system/primitives/VirtualTable.tsx`

## Custom Table CSS and Page-Specific Patterns

- Admin styles in `frontend/admin/src/design-system/primitives/primitives.css`
- Admin styles in `frontend/admin/src/design-system/primitives/primitives-dashboard.css`
- Per-page usage
  - Users: migrated to shared `.table-*` helpers
  - Servers: `.data-table-row`, `.data-table-cell-stale`, `.data-table-snapshot-stale`

## Performance Notes

- Users: tanstack virtualizer for >50 rows; row height aligned to 48px
- Servers: tanstack virtualizer for >200 rows; row height aligned to density via CSS
- Telemetry Docker: manual virtualization, 48px row height

## Target Mapping

| Table Location | Target | Notes |
| --- | --- | --- |
| Dashboard TopIssuesTable | Migrate to shared `Table` (already) | Align empty/loading via `Table` APIs |
| Dashboard RecentAuditTable | Migrate to shared `Table` (already) | Align empty/loading via `Table` APIs |
| Users page | Migrate to shared `VirtualTable` adapter | Replaced manual `<table>` + `TableSortHeader` + custom CSS |
| Servers page | Migrate to shared `VirtualTable` adapter | Replace manual `<table>` + `ServerRow` usage (may need row render support) |
| Devices page | Migrate to shared `Table` (already) | Use new column helpers for truncation/mono/numeric |
| Audit page | Migrate to shared `Table` (already) | Use new empty/loading API |
| Billing Payments/Subscriptions tabs | Migrate to shared `Table` (already) | Use new empty/loading API |
| Server Detail tables | Migrate to shared `Table` (already) | Use new column helpers |
| Control Plane tables | Migrate to shared `Table` (already) | Use new column helpers |
| Telemetry DockerOverview | Migrate to shared `VirtualTable` adapter | Replaced custom grid with shared `VirtualTable` |
| Telemetry VPN Nodes | Migrate to shared `Table` (already) | Use new column helpers |
