# Table Styles Guide (Single Source of Truth)

Date: 2026-02-21

## Rule of Thumb

- Feature pages must not define table CSS beyond layout (margins, placement).
- All visual table styling comes from shared UI (`TableContainer`, `Table`, `VirtualTable`, `TableCell`).

## Canonical Classes and Tokens

- Container
  - `.data-table-wrap`: border, radius, surface, overflow
- Base table
  - `.table`: layout, typography, sticky header
  - `.table-wrap`: horizontal scroll wrapper
- Row
  - `.table-row-clickable`: hover/active state for clickable rows
  - `.table-row-selected`: selected/highlighted rows
- Cell utilities
  - `.table-cell-truncate`: ellipsis + `title` for tooltips
  - `.table-cell-numeric`: right-aligned + tabular numbers
  - `.table-cell-mono`: monospace
  - `.table-cell-actions`: right-aligned actions column
  - `.table-cell-align-right`, `.table-cell-align-center`
- Density
  - `.table-density-compact` -> 40px rows
  - Default (comfortable) -> 48px rows

## Deprecated / Removed Patterns

- `.data-table-row`
- `.data-table-actions` / `.data-table-actions-head`
- `.data-table-cell-compound` / `.data-table-cell-primary` / `.data-table-cell-muted`
- `.data-table-avatar`
- `.data-table-grid*` (replaced by `VirtualTable`)

Use `TableCell`, `CellText`, `CellNumber`, `CellActions`, and column flags to achieve the same behavior.

## How to Build Compound Cells

- Use render functions and `TableCell` helpers:
  - `TableCell` for truncation, alignment, mono/numeric
  - `CellText` for truncation + tooltip
  - `CellNumber` for numeric alignment
  - `CellActions` for actions columns

If additional composition is needed, create small shared UI helpers in `frontend/shared/src/ui/table/CellHelpers.tsx`.

## Empty / Loading / Pagination

- Use `Table` / `VirtualTable` built-in `emptyTitle`, `emptyHint`, `emptyAction`.
- Use `loading` + `rowsSkeletonCount` rather than ad-hoc skeletons.
- Use `TableSection` for header/actions + pagination.

## Operator Mode

- Scope: `[data-console="operator"]`
- Defaults:
  - Compact density is the baseline for admin operator surfaces.
  - Cell paddings target `6px` (regular) / `4px` (compact) vertical, `8px` horizontal.
  - Hover state remains subtle and non-decorative.
- Keep using existing utility classes:
  - `.table-cell-numeric` for right-aligned tabular values
  - `.table-cell-truncate` plus `title` for overflowed content
