import type { HTMLAttributes, ReactNode } from "react";
import { Skeleton } from "../../components/feedback/Skeleton";
import { StatusChip } from "./StatusChip";
import { IconRotateCw } from "../../icons";

export type DataCellValueTone = "teal" | "green" | "amber" | "red" | "mut" | "ip";
export type DataCellType = "default" | "ip" | "status" | "latency" | "plan";
export type DataGridLayout = "2x2" | "1xcol";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface DataCellProps {
  label: string;
  value: ReactNode;
  valueTone?: DataCellValueTone;
  className?: string;
  cellType?: DataCellType;
  loading?: boolean;
  stale?: boolean;
  tooltip?: string;
}

export function DataCell({
  label,
  value,
  valueTone,
  className = "",
  cellType = "default",
  loading = false,
  stale = false,
  tooltip,
}: DataCellProps) {
  const isStatusCell = cellType === "status";
  const renderedValue = loading ? (
    <Skeleton variant="shimmer" width="72%" height={18} />
  ) : isStatusCell && (value == null || value === "") ? (
    <StatusChip variant="info">Unknown</StatusChip>
  ) : (
    value
  );

  return (
    <div
      className={joinClasses(
        "data-cell",
        `data-cell--${cellType}`,
        stale && "data-cell--stale",
        className
      )}
    >
      <div className="dc-key">{label}</div>
      <div
        className={joinClasses("dc-val", valueTone ?? "", `dc-val--${cellType}`, stale && "dc-val--stale")}
        title={tooltip}
      >
        <span className="dc-val-text">{renderedValue}</span>
        {stale && !loading ? (
          <span className="dc-stale-indicator" aria-label="Stale value">
            <IconRotateCw size={12} strokeWidth={1.8} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export interface DataGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: 2 | 1 | 3;
  layout?: DataGridLayout;
}

/** Content Library 5: key/value data grid. */
export function DataGrid({
  children,
  columns = 2,
  layout = "2x2",
  className = "",
  ...props
}: DataGridProps) {
  const gridClass =
    columns === 1
      ? "data-grid wide"
      : columns === 3
        ? "data-grid three"
        : "data-grid";
  return (
    <div className={joinClasses(gridClass, `data-grid--${layout}`, className)} {...props}>
      {children}
    </div>
  );
}
