# Table QA Checklist

Date: 2026-02-21

## Functional

- Sorting works in all sortable tables.
- Selection (row + select all) behaves correctly.
- Pagination updates offset correctly and matches totals.
- Empty state copy is consistent and uses shared empty UI.
- Loading state uses table skeleton and does not shift layout.

## Visual

- Table header typography and row spacing are consistent.
- Hover and active row states are identical across pages.
- Actions column is right-aligned and consistent width.
- Numeric columns are right-aligned with tabular numbers.
- Truncation shows ellipsis and title tooltip consistently.
- Density toggles produce 40px (compact) / 48px (comfortable) rows.

## Performance

- Virtualized tables scroll smoothly with large row counts.
- Virtualized rows align to density tokens (40/48px).
- Virtualized tables do not break sticky headers (if used).

## Regression Guards

- No new `<table className="table">` usage outside shared `Table`/`VirtualTable` components.
- No new `.data-table-*` page-level classes in feature pages.
- E2E selectors updated where `.data-table-grid-row` was removed.

