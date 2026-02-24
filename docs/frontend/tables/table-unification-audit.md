# Table Unification Audit

Date: 2026-02-21

## Inventory (Tables + Routes)

- Dashboard `/` (DashboardPage)
  - `frontend/admin/src/pages/dashboard/TopIssuesTable.tsx`
    - API: `Table` + `Column<T>`
    - Features: truncation, compact density
    - Sorting: none
    - Pagination: none
    - Selection: none
    - Custom CSS: none beyond shared
    - Performance: low row count (limit 10)
  - `frontend/admin/src/pages/dashboard/RecentAuditTable.tsx`
    - API: `Table` + `Column<T>`
    - Features: truncation, compact density
    - Sorting: none
    - Pagination: none
    - Selection: none
    - Custom CSS: none beyond shared
    - Performance: low row count (limit 10)

- Telemetry `/telemetry` (TelemetryPage)
  - Docker Services tab
    - `frontend/admin/src/pages/telemetry/DockerOverviewTable.tsx`
      - API: `VirtualTable` + `Column<T>`
      - Features: truncation, numeric alignment, actions, selected row
      - Sorting: none
      - Pagination: none
      - Selection: single row highlight
      - Custom CSS: shared `.table-*` utilities
      - Performance: tanstack virtualizer (via `VirtualTable`), ROW_HEIGHT=48, VIEWPORT_HEIGHT=420
  - VPN Nodes tab
    - `frontend/admin/src/pages/telemetry/VpnNodesTab.tsx`
      - API: `Table` + `Column<T>`
      - Features: numeric/mono/truncate
      - Sorting: none
      - Pagination: none
      - Selection: none
      - Custom CSS: none beyond shared
      - Performance: moderate rows (unknown)

- Control Plane `/automation`
  - `frontend/admin/src/pages/ControlPlane.tsx`
    - API: `Table` + `Column<T>`
    - Features: numeric, truncate
    - Sorting: none
    - Pagination: none
    - Selection: none
    - Custom CSS: none beyond shared
    - Performance: moderate rows (unknown)

- Servers `/servers`
  - `frontend/admin/src/pages/Servers.tsx`
    - API: manual `<table>` inside `TableContainer` (custom row via `ServerRow`)
    - Features: selection (checkbox), density toggle, row click, actions, numeric cells
    - Sorting: external control (FilterBar, not table header)
    - Pagination: `Pagination`
    - Custom CSS: `.data-table-row`, stale/snapshot stale classes, table density class
    - Performance: tanstack virtualizer when `visibleItems.length > 200`

- Server Detail `/servers/:id`
  - `frontend/admin/src/pages/ServerDetail.tsx`
    - API: `Table` + `Column<T>`
    - Features: truncation, numeric
    - Sorting: none
    - Pagination: none
    - Selection: none
    - Custom CSS: none beyond shared
    - Performance: moderate rows (unknown)

- Users `/users`
  - `frontend/admin/src/pages/Users.tsx`
    - API: `VirtualTable` + `Column<T>`
    - Features: sorting, actions, compound user cell, secondary text, virtualization
    - Sorting: `Table` built-in sort UI via `sortKey` + `onSort`
    - Pagination: `Pagination`
    - Selection: none
    - Custom CSS: shared `.table-*` utilities
    - Performance: tanstack virtualizer (via `VirtualTable`), maxHeight at 480px for >50 rows

- User Detail `/users/:id`
  - `frontend/admin/src/pages/UserDetail.tsx`
    - API: no table; uses `.table-empty` for empty notices
    - Custom CSS: uses shared `.table-empty`

- Devices `/devices`
  - `frontend/admin/src/pages/Devices.tsx`
    - API: `Table` + `Column<T>` inside `TableSection`
    - Features: selection (checkbox), truncation, mono, numeric, actions
    - Sorting: none
    - Pagination: `TableSection` pagination
    - Custom CSS: none beyond shared
    - Performance: moderate rows (limit 20, higher for region filter)

- Audit `/audit`
  - `frontend/admin/src/pages/Audit.tsx`
    - API: `Table` + `Column<T>` inside `TableSection`
    - Features: truncate
    - Sorting: none
    - Pagination: `TableSection` pagination
    - Custom CSS: none beyond shared
    - Performance: moderate rows

- Billing `/billing`
  - `frontend/admin/src/pages/billing/PaymentsTab.tsx`
    - API: `Table` + `Column<T>` inside `TableSection`
    - Features: numeric, truncate
    - Sorting: none
    - Pagination: `TableSection` pagination
    - Custom CSS: none beyond shared
    - Performance: moderate rows
  - `frontend/admin/src/pages/billing/SubscriptionsTab.tsx`
    - API: `Table` + `Column<T>` inside `TableSection`
    - Features: numeric, truncate
    - Sorting: none
    - Pagination: `TableSection` pagination
    - Custom CSS: none beyond shared
    - Performance: moderate rows
  - `/payments` and `/subscriptions` redirect to `/billing?tab=payments` and `/billing?tab=subscriptions`

## Table-Related Shared Components

- `frontend/shared/src/ui/Table.tsx`
  - Canonical `Table` + `Column<T>` component
  - Supports selection, sorting, density, truncation utilities
- `frontend/shared/src/ui/table/TableContainer.tsx`
  - Container for borders/overflow
- `frontend/shared/src/ui/table/TableSkeleton.tsx`
  - Loading skeleton
- `frontend/shared/src/ui/TableCell.tsx` + `CellHelpers`
  - Truncation, numeric, mono utilities
- `frontend/admin/src/components/TableSection.tsx`
  - Layout wrapper for header/actions/pagination

## Custom Table CSS and Page-Specific Patterns

- Shared styles in `frontend/shared/src/ui/styles.css`
  - `.data-table-*` (row, actions, compound cells, avatar, grid styles)
  - `.table-*` (base table styles, truncation, numeric, density)
- Admin styles in `frontend/admin/src/admin.css`
  - `TableSection` classes: `.ref-table-section*`
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
