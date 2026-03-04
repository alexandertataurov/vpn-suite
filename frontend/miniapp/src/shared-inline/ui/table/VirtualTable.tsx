import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "../../utils/cn";
import { EmptyState } from "../feedback/EmptyState";
import { TableContainer } from "./TableContainer";
import { TableSkeleton } from "./TableSkeleton";
import { getCellClasses, getColumnStyle, renderCellContent } from "./cellUtils";
import type { Column, TableSelection } from "./Table";

export interface VirtualTableProps<T> {
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
  /** Scroll container height (px or CSS string) */
  height?: number | string;
  /** Optional max height for scroll container */
  maxHeight?: number | string;
  /** Override row height for virtualization */
  rowHeight?: number;
  /** Virtualizer overscan rows */
  overscan?: number;
  className?: string;
  /** Optional for tests */
  "data-testid"?: string;
}

function resolveRowHeight(density: "comfortable" | "compact", rowHeight?: number): number {
  if (rowHeight != null) return rowHeight;
  return density === "compact" ? 40 : 48;
}

export function VirtualTable<T>({
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
  height,
  maxHeight,
  rowHeight,
  overscan = 6,
  className = "",
  "data-testid": dataTestId,
}: VirtualTableProps<T>) {
  const keyFn = keyFnProp ?? keyExtractor;
  if (!keyFn || typeof keyFn !== "function") {
    throw new Error("VirtualTable requires keyFn or keyExtractor function");
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const resolvedRowHeight = resolveRowHeight(density, rowHeight);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => resolvedRowHeight,
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const bodyStyle = useMemo<CSSProperties>(() => {
    return { height: `${totalSize}px`, position: "relative" };
  }, [totalSize]);
  const getRowStyle = (start: number): CSSProperties => {
    return {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      transform: `translateY(${start}px)`,
      height: resolvedRowHeight,
    };
  };

  const toggleRow = (id: string | number) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };
  const toggleAll = () => {
    if (!selection) return;
    const ids = data.map((r) => keyFn(r)); // key=
    const allSelected = ids.every((id) => selection.selected.has(id));
    selection.onChange(allSelected ? new Set() : new Set(ids));
  };

  const containerStyle = useMemo<CSSProperties | undefined>(() => {
    if (height == null) return undefined;
    return {
      height: typeof height === "number" ? `${height}px` : height,
      overflow: "auto",
    };
  }, [height]);

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

  return (
    <TableContainer
      ref={scrollRef}
      maxHeight={maxHeight}
      style={containerStyle}
      data-testid={dataTestId ?? "table-root"}
    >
      <div className={cn(density === "compact" && "ds-table-density-compact", className)}>
        <table className="ds-table table-virtual">
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
              {columns.map((col) => ( // key=
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
                    <button type="button"
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
          <tbody style={bodyStyle}>
            {virtualRows.map((virtualRow) => { // key=
              const row = data[virtualRow.index];
              if (row == null) return null;
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
                  style={getRowStyle(virtualRow.start)}
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
                  {columns.map((col) => { // key=
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
