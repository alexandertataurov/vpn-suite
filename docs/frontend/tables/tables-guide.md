# Tables Guide — Unified Design System

## Overview

All tables in the admin use the shared table system. Use `Table` for declarative column-based data, `TableContainer` for custom layouts (e.g. Servers with `ServerRow`), and `TableSkeleton` for loading states.

## Components

### Table (Declarative)

Use when you have columns + data arrays:

```tsx
import { Table, TableCell } from "@vpn-suite/shared/ui";

<Table
  columns={[
    { key: "name", header: "Name", render: (r) => r.name, truncate: true },
    { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
    { key: "count", header: "Count", numeric: true, render: (r) => r.count },
    { key: "actions", header: "", actions: true, render: (r) => <Button>View</Button> },
  ]}
  data={items}
  keyExtractor={(r) => r.id}
  emptyMessage="No items"
  density="compact"
/>
```

### Column Config

| Prop | Type | Purpose |
|------|------|---------|
| `key` | string | Unique column id |
| `header` | string | Column header text |
| `render` | (row) => ReactNode | Cell content |
| `truncate` | boolean | Ellipsis + title tooltip |
| `numeric` | boolean | Right align + tabular-nums |
| `mono` | boolean | Monospace font |
| `align` | "left" \| "right" \| "center" | Cell alignment |
| `actions` | boolean | Actions column (right-aligned) |
| `sortKey` | string | Key for sort (use with `onSort`) |

### TableContainer (Wrapper)

Use for raw `<table>` with custom rows (e.g. Servers with `ServerRow`):

```tsx
import { TableContainer } from "@vpn-suite/shared/ui";

<TableContainer style={{ maxHeight: 480 }}>
  <table className="table">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</TableContainer>
```

### TableSkeleton

```tsx
<TableSkeleton rows={4} columns={5} density="comfortable" />
```

### TableSortHeader

```tsx
<th>
  <TableSortHeader active={sortKey === "email"} sortDir={sortDir} onClick={() => onSort("email")}>
    Email
  </TableSortHeader>
</th>
```

### Cell Helpers

- `CellText` — truncate + optional mono, title
- `CellNumber` — right align, tabular-nums
- `CellActions` — right-aligned actions container

## Styling Conventions

- Text left; numbers right; actions right
- Use `table-cell-truncate` for long content; add `title` for tooltip
- Use `table-cell-numeric` for counts, IDs
- Use `data-table-row` for clickable rows with hover
- Use `data-table-cell-muted` / `data-table-cell-secondary` for secondary text

## Div-Based Grid (DockerOverviewTable)

For virtualized div grids, use `data-table-grid`, `data-table-grid-header`, `data-table-grid-row`, `table-cell-truncate`, `table-cell-numeric`.
