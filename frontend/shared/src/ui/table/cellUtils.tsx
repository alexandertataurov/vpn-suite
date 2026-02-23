import type { CSSProperties, ReactNode, Key } from "react";
import { cn } from "../../utils/cn";
import { TableCell } from "../primitives/TableCell";

export interface ColumnShape<T = unknown> {
  truncate?: boolean;
  numeric?: boolean;
  actions?: boolean;
  mono?: boolean;
  align?: "left" | "right" | "center";
  titleTooltip?: (row: T) => string | undefined;
  className?: string;
  width?: number | string;
  minWidth?: number | string;
  render?: (row: T) => ReactNode;
}

export function getCellClasses<T>(col: ColumnShape<T>): string {
  const classes: string[] = [];
  if (col.actions) classes.push("table-cell-actions");
  if (col.className) classes.push(col.className);
  return classes.join(" ");
}

export function getColumnStyle<T>(col: ColumnShape<T>): CSSProperties | undefined {
  if (col.width == null && col.minWidth == null) return undefined;
  const style: CSSProperties = {};
  if (col.width != null) style.width = typeof col.width === "number" ? `${col.width}px` : col.width;
  if (col.minWidth != null) style.minWidth = typeof col.minWidth === "number" ? `${col.minWidth}px` : col.minWidth;
  return style;
}

export function renderCellContent<T>(
  col: ColumnShape<T>,
  row: T,
  cellProps?: { className?: string; style?: CSSProperties; dataTestId?: string; cellKey?: Key }
): ReactNode {
  const content = typeof col.render === "function" ? col.render(row) : null;
  const title = col.titleTooltip ? col.titleTooltip(row) : undefined;
  return (
    <TableCell
      key={cellProps?.cellKey}
      truncate={col.truncate}
      numeric={col.numeric || col.actions}
      mono={col.mono}
      align={col.actions ? "right" : col.align}
      title={title}
      className={cn(cellProps?.className)}
      style={cellProps?.style}
      data-testid={cellProps?.dataTestId}
    >
      {content}
    </TableCell>
  );
}
