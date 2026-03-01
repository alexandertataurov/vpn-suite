import type { TdHTMLAttributes } from "react";
import { TableCell as PrimitiveTableCell } from "./TableCell";

export interface MetricCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  truncate?: boolean;
  mono?: boolean;
}

export function MetricCell({ align = "right", truncate, mono = true, className = "", ...props }: MetricCellProps) {
  return (
    <PrimitiveTableCell
      align={align}
      numeric
      mono={mono}
      truncate={truncate}
      className={className}
      {...props}
    />
  );
}
