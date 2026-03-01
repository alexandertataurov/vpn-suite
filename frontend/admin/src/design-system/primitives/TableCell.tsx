import type { TdHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";

export type PrimitiveTableCellAlign = "left" | "center" | "right";

export interface PrimitiveTableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: PrimitiveTableCellAlign;
  truncate?: boolean;
  numeric?: boolean;
  mono?: boolean;
}

export function TableCell({ align = "left", truncate, numeric, mono, className = "", ...props }: PrimitiveTableCellProps) {
  return (
    <td
      className={cn(
        "ds-table-cell",
        truncate && "ds-table-cell-truncate",
        numeric && "ds-table-cell-numeric",
        mono && "ds-table-cell-mono",
        className
      )}
      data-align={align}
      {...props}
    />
  );
}
