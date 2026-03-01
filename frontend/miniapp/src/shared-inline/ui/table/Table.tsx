/**
 * Table component with Table Style Contract support.
 * Renders inside TableContainer wrapper for consistent border, radius, overflow.
 *
 * Table Style Contract (single source of truth):
 * - Row height: comfortable = 48px min; compact = 40px
 * - Cell padding: token-based
 * - Typography: header = font-size-sm, font-weight-600; body = font-size-sm
 * - Alignment: text = left; numeric = right + tabular-nums; actions = right
 * - Overflow: truncate + title; table-layout: fixed; sticky header: yes
 */
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "../buttons/Button";
import { EmptyState } from "../feedback/EmptyState";
import { TableContainer } from "./TableContainer";
import { TableSkeleton } from "./TableSkeleton";
import { getCellClasses, getColumnStyle, renderCellContent } from "./cellUtils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortKey?: string;
  /** Cell alignment: left (default), right, center */
  align?: "left" | "right" | "center";
  /** Truncate with ellipsis; use with title in render for tooltip */
  truncate?: boolean;
  /** Tooltip content for truncated cells */
  titleTooltip?: (row: T) => string | undefined;
  /** Numeric: tabular-nums + right align */
  numeric?: boolean;
  /** Monospace font (IDs, tokens) */
  mono?: boolean;
  /** Actions column: right-aligned, fixed width */
  actions?: boolean;
  /** Optional fixed width or minimum width */
  width?: number | string;
  minWidth?: number | string;
  /** Extra class for td/th */
  className?: string;
}

export interface TableSelection {
  selected: Set<string | number>;
  onChange: (selected: Set<string | number>) => void;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Row key for React list. Use keyFn or keyExtractor. */
  keyFn?: (row: T) => string | number;
  /** Alias for keyFn (common naming). */
  keyExtractor?: (row: T) => string | number;
  emptyMessage?: string;
  /** Empty state title; when set, renders EmptyState instead of emptyMessage */
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: ReactNode;
  /** Loading state; when true, renders TableSkeleton */
  loading?: boolean;
  /** Skeleton rows count */
  rowsSkeletonCount?: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  /** Optional row selection; adds checkbox column. keyFn is used as row id. */
  selection?: TableSelection;
  /** Row density: comfortable (default) or compact */
  density?: "comfortable" | "compact";
  /** Optional row click handler */
  onRowClick?: (row: T) => void;
  /** Optional row class name */
  rowClassName?: (row: T) => string | undefined;
  className?: string;
  /** Optional for tests */
  "data-testid"?: string;
}

export function Table<T>({
  columns,
  data,
  keyFn: keyFnProp,
  keyExtractor,
  emptyMessage = "No data",
  emptyTitle,
  emptyHint,
  emptyAction,
  loading = false,
  rowsSkeletonCount = 4,
  sortKey,
  sortDir,
  onSort,
  selection,
  density = "comfortable",
  onRowClick,
  rowClassName,
  className = "",
  "data-testid": dataTestId,
}: TableProps<T>) {
  const keyFn = keyFnProp ?? keyExtractor;
  if (!keyFn || typeof keyFn !== "function") {
    throw new Error("Table requires keyFn or keyExtractor function");
  }
  if (loading) {
    return (
      <TableSkeleton
        rows={rowsSkeletonCount}
        columns={columns.length || 5}
        density={density}
        className={className}
        data-testid={dataTestId ?? "table-root"}
      />
    );
  }
  if (data.length === 0) {
    return (
      <TableContainer data-testid={dataTestId ?? "table-root"}>
        {emptyTitle ? (
          <div className={cn("table-empty", className)} role="status">
            <EmptyState title={emptyTitle} description={emptyHint} actions={emptyAction} />
          </div>
        ) : (
          <div className={cn("table-empty", className)} role="status">
            {emptyMessage}
          </div>
        )}
      </TableContainer>
    );
  }

  const toggleRow = (id: string | number) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };
  const toggleAll = () => {
    if (!selection) return;
    const ids = data.map((r) => keyFn(r));
    const allSelected = ids.every((id) => selection.selected.has(id));
    selection.onChange(allSelected ? new Set() : new Set(ids));
  };

  return (
    <TableContainer data-testid={dataTestId ?? "table-root"}>
      <div className={cn(density === "compact" && "ds-table-density-compact", className)}>
      <table className="ds-table">
        <thead data-testid="table-head">
          <tr>
            {selection ? (
              <th className="ds-table-cell-checkbox">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={data.length > 0 && data.every((r) => selection.selected.has(keyFn(r)))}
                  onChange={toggleAll}
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={getCellClasses(col)}
                style={getColumnStyle(col)}
                aria-sort={
                  col.sortKey && onSort && sortKey === (col.sortKey ?? col.key)
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {col.sortKey && onSort ? (
                  <button
                    type="button"
                    className="ds-table-sort"
                    onClick={() => onSort(col.sortKey ?? col.key)}
                  >
                    {col.header}
                    {sortKey === (col.sortKey ?? col.key)
                      ? sortDir === "asc"
                        ? " ↑"
                        : " ↓"
                      : ""}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowId = keyFn(row);
            const rowClickable = typeof onRowClick === "function";
            const rowClass = cn(
              rowClickable && "ds-table-row-clickable",
              rowClassName ? rowClassName(row) : undefined
            );
            return (
              <tr
                key={rowId}
                data-testid="table-row"
                className={rowClass || undefined}
                onClick={rowClickable ? () => onRowClick(row) : undefined}
                role={rowClickable ? "button" : undefined}
                tabIndex={rowClickable ? 0 : undefined}
                onKeyDown={
                  rowClickable
                    ? (e) => {
                        if (e.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
              >
                {selection ? (
                  <td className="ds-table-cell-checkbox">
                    <input
                      type="checkbox"
                      aria-label={`Select row ${rowId}`}
                      checked={selection.selected.has(rowId)}
                      onChange={() => toggleRow(rowId)}
                    />
                  </td>
                ) : null}
                {columns.map((col) => {
                  const cellClasses = getCellClasses(col);
                  const isActions = col.actions;
                  return renderCellContent(col, row, {
                    cellKey: col.key,
                    className: cellClasses || undefined,
                    style: getColumnStyle(col),
                    dataTestId: isActions ? "table-actions" : "table-cell",
                  });
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </TableContainer>
  );
}

export interface PaginationProps {
  offset: number;
  limit: number;
  total: number;
  onPage: (offset: number) => void;
}

export function Pagination({ offset, limit, total, onPage }: PaginationProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <nav className="pagination" aria-label="Pagination">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!hasPrev}
        onClick={() => onPage(Math.max(0, offset - limit))}
      >
        Previous
      </Button>
      <span className="pagination-info">
        Page {page} of {totalPages} ({total} total)
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!hasNext}
        onClick={() => onPage(offset + limit)}
      >
        Next
      </Button>
    </nav>
  );
}
