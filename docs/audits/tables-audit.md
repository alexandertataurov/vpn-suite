# Tables Audit — Unified Design System

## Before (Pre-Migration)

### Three Table Implementations

| System | Location | Used By | Classes |
|--------|----------|---------|---------|
| Shared Table | `frontend/shared/src/ui/Table.tsx` | TopIssuesTable, RecentAuditTable, Devices, Subscriptions, Payments, Audit, OutlineIntegrations, ServerDetail, ControlPlane, VpnNodesTab | `table-wrap`, `table`, `table-empty`, `table-cell-*` |
| Raw HTML tables | Servers.tsx, Users.tsx | Servers page, Users page | `ref-users-table-wrap`, `ref-users-table`, `ref-server-row`, `ref-user-row` |
| Docker div-grid | DockerOverviewTable.tsx | DockerServicesTab | `docker-table-shell`, `docker-table-row`, `docker-table-cell-*` |

### CSS Distribution

- **Shared** `styles.css`: `.table-wrap`, `.table`, `.table-cell-*`, `.table-empty`
- **Admin** `admin.css`: `.ref-servers-table`, `.ref-users-table`, `.ref-*-table-wrap`, `.ref-server-row`, `.ref-user-row`, `.docker-table-*`

### Redundancy

- `ref-servers-table` and `ref-users-table` were nearly identical
- `table-cell-truncate` ≈ `docker-table-cell-truncate`
- Admin overrode shared via `admin-main .table-wrap`

---

## After (Post-Migration)

### Single DataTable Kit

| Component | Location | Purpose |
|-----------|----------|---------|
| DataTable | `frontend/shared/src/ui/table/DataTable.tsx` | Wrapper: overflow, border, radius |
| Table | `frontend/shared/src/ui/Table.tsx` | Declarative columns + data |
| TableSkeleton | `frontend/shared/src/ui/table/TableSkeleton.tsx` | Loading rows |
| TableSortHeader | `frontend/shared/src/ui/table/TableSortHeader.tsx` | Sortable column header |
| CellText, CellNumber, CellActions | `frontend/shared/src/ui/table/CellHelpers.tsx` | Cell composition helpers |

### Unified Classes

- `data-table-wrap` — table container (border, radius, overflow)
- `table` — semantic HTML table
- `table-cell-truncate`, `table-cell-numeric`, `table-cell-mono` — cell utilities
- `data-table-row`, `data-table-sort` — row/header styling
- `data-table-grid-*` — div-based grid (DockerOverviewTable)

### Design Tokens

- `--table-row-height-sm/md/lg`
- `--table-cell-padding-x`, `--table-cell-padding-y-sm/md`
- `--table-border`, `--table-hover-bg`, `--table-header-fg`, `--table-muted-fg`

---

## Files Modified

| File | Changes |
|------|---------|
| `frontend/shared/src/theme/tokens.css` | Added table tokens |
| `frontend/shared/src/ui/Table.tsx` | Wraps in DataTable |
| `frontend/shared/src/ui/styles.css` | Added data-table-* styles |
| `frontend/shared/src/ui/table/*` | New DataTable, TableSkeleton, TableSortHeader, CellHelpers |
| `frontend/admin/src/pages/Servers.tsx` | DataTable, TableSkeleton, table class |
| `frontend/admin/src/pages/Users.tsx` | DataTable, TableSortHeader, data-table-* classes |
| `frontend/admin/src/pages/telemetry/DockerOverviewTable.tsx` | data-table-grid-* classes |
| `frontend/admin/src/components/ServerRow.tsx` | data-table-row, data-table-cell-stale |
| `frontend/admin/src/admin.css` | Removed ref-*-table*, docker-table-* |

---

## E2E Selectors Updated

- `nav-and-pages.spec.ts`: `.ref-users-table-wrap` → `.data-table-wrap`
- `telemetry-docker.spec.ts`: `.docker-table-row` → `.data-table-grid-row`
