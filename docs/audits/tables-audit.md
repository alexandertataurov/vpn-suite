# Tables Audit — Unified Design System

## Before (Pre-Migration)

### Three Table Implementations

| System | Location | Used By | Classes |
|--------|----------|---------|---------|
| Admin table primitives | `frontend/admin/src/design-system/primitives/Table.tsx` | Admin feature pages | `table-wrap`, `table`, `table-empty`, `table-cell-*` |
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
| DataTable | `frontend/admin/src/design-system/primitives/DataTable.tsx` | Wrapper: overflow, border, radius |
| Table | `frontend/admin/src/design-system/primitives/Table.tsx` | Declarative columns + data |
| VirtualTable | `frontend/admin/src/design-system/primitives/VirtualTable.tsx` | Virtualized rendering |
| Skeleton | `frontend/admin/src/design-system/primitives/Skeleton.tsx` | Loading skeleton blocks |

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
| `frontend/admin/src/design-system/tokens/tokens.css` | Table-related tokens |
| `frontend/admin/src/design-system/primitives/primitives.css` | Table classes and base styles |
| `frontend/admin/src/features/servers/ServersPage.tsx` | DataTable usage in current servers UI |
| `frontend/admin/src/features/users/UsersPage.tsx` | DataTable usage in current users UI |
| `frontend/admin/src/features/telemetry/TelemetryPage.tsx` | DataTable usage in current telemetry UI |
| `frontend/admin/src/admin.css` | Removed ref-*-table*, docker-table-* |

---

## E2E Selectors Updated

- `nav-and-pages.spec.ts`: `.ref-users-table-wrap` → `.data-table-wrap`
- `telemetry-docker.spec.ts`: `.docker-table-row` → `.data-table-grid-row`
