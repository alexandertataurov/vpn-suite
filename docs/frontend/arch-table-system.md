# Unified Table System Architecture

Date: 2026-02-21

## Goals

- One canonical API for list tables across admin + shared UI.
- Identical UX and styling between standard and virtualized tables.
- Performance preserved for large datasets via virtualization.
- Make correct usage easy, reduce ad-hoc table styles.

## Canonical Components

### 1) `DataTable`

- Single container for all tables.
- Responsibilities: border, radius, background, overflow.
- Provides optional `maxHeight` and `style` for scroll container.

### 2) `Table<T>` (standard renderer)

- Renders HTML `<table>` inside `DataTable`.
- Column API: `Column<T>` with alignment, truncation, numeric/mono, actions, width hints, sorting.
- Built-in empty state, skeleton, density, selection.
- Sorting UI is built in (no external `TableSortHeader` usage in feature pages).

### 3) `VirtualTable<T>` (virtualized renderer)

- Uses tanstack `useVirtualizer`.
- Same `Column<T>` API as `Table<T>`.
- Same `DataTable` container, `TableCell` utilities, sorting UI, density tokens.
- Identical header and body cell styling; only row rendering is virtualized.
- Fixed row heights aligned to density tokens (compact 40px, comfortable 48px).

### 4) `TableSection`

- Canonical wrapper for “table + header/actions + pagination”.
- Feature pages use this for layout consistency.

## Column API (shared)

```
Column<T>:
- key: string
- header: ReactNode
- render: (row: T) => ReactNode
- sortKey?: string
- truncate?: boolean
- titleTooltip?: (row: T) => string | undefined
- numeric?: boolean
- mono?: boolean
- actions?: boolean
- align?: left | right | center
- width?: number | string
- minWidth?: number | string
- className?: string
```

## Styling Contract

- `DataTable` sets container borders, radius, background.
- `.table` defines base typography, padding, border, sticky header.
- `.table-cell-*` utilities handle truncation, numeric, mono, align, actions.
- Density uses `.table-density-compact` (compact 40px) and default (comfortable 48px).
- Row hover/selected styles are global and consistent.

## Virtualization Details

- `VirtualTable` renders a normal `<table>` and `<thead>`.
- `<tbody>` height is set to total virtual size; rows are absolutely positioned.
- Row height defaults to density mapping but can be overridden via `rowHeight`.
- `height` or `maxHeight` on `DataTable` to enable scrolling.

## Tradeoffs

- `VirtualTable` requires fixed row heights for stable virtualization.
- Very complex row content (variable height) should use standard `Table`.
- Some legacy row components (e.g., `ServerRow`) may need to move logic into column renderers or a row-render mode in `VirtualTable` if direct row reuse is needed.

## Migration Strategy

- Adopt `Table` everywhere by default.
- Migrate high-row-count tables to `VirtualTable` (Users, Servers, Telemetry Docker) while preserving existing UX.
- Remove page-specific table CSS and rely on shared utilities.

