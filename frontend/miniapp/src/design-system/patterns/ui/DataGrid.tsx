import type { HTMLAttributes, ReactNode } from "react";

export type DataCellValueTone = "teal" | "green" | "amber" | "red" | "mut" | "ip";

export interface DataCellProps {
  label: string;
  value: ReactNode;
  valueTone?: DataCellValueTone;
  className?: string;
}

export function DataCell({ label, value, valueTone, className = "" }: DataCellProps) {
  return (
    <div className={`data-cell ${className}`.trim()}>
      <div className="dc-key">{label}</div>
      <div className={`dc-val ${valueTone ?? ""}`.trim()}>{value}</div>
    </div>
  );
}

export interface DataGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: 2 | 1 | 3;
}

/** Content Library 5: key/value data grid. columns: 2 (default), 1 (wide), 3 (three). */
export function DataGrid({
  children,
  columns = 2,
  className = "",
  ...props
}: DataGridProps) {
  const gridClass =
    columns === 1 ? "data-grid wide" : columns === 3 ? "data-grid three" : "data-grid";
  return (
    <div className={`${gridClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
