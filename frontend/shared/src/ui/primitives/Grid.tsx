import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveGridColumns = "1" | "2" | "3" | "4" | "auto";

export type PrimitiveGridMinWidth = "col" | "col-sm" | "card" | "card-lg";

export interface PrimitiveGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: PrimitiveGridColumns;
  gap?: string;
  minWidth?: PrimitiveGridMinWidth;
  children: ReactNode;
}

export function Grid({ columns = "auto", gap = "2", minWidth, className = "", children, ...props }: PrimitiveGridProps) {
  return (
    <div
      className={cn("ds-grid", className)}
      data-columns={columns}
      data-gap={gap}
      data-min-width={minWidth}
      {...props}
    >
      {children}
    </div>
  );
}
