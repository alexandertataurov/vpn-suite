import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveTableRowProps = HTMLAttributes<HTMLTableRowElement>;

export function TableRow({ className = "", ...props }: PrimitiveTableRowProps) {
  return <tr className={cn("ds-table-row", className)} {...props} />;
}
