import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface TableSortHeaderProps {
  children: ReactNode;
  /** Current sort direction when this column is active */
  sortDir?: "asc" | "desc";
  /** Whether this column is the active sort */
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Sortable column header button.
 * @deprecated Prefer Table column sortKey + onSort instead of manual usage.
 */
export function TableSortHeader({
  children,
  sortDir,
  active,
  onClick,
  className = "",
}: TableSortHeaderProps) {
  const indicator = active && sortDir ? (sortDir === "asc" ? " ↑" : " ↓") : "";
  return (
    <button
      type="button"
      className={cn("ds-table-sort", className)}
      onClick={onClick}
      aria-sort={active && sortDir ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
    >
      {children}
      {indicator}
    </button>
  );
}
