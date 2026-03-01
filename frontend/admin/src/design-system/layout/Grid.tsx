import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type GridColumns = 1 | 2 | 3 | 4 | "auto";
export type GridGap = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
export type GridMinWidth = "col" | "col-sm" | "card" | "card-lg";

export interface GridProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  columns?: GridColumns;
  gap?: GridGap;
  minWidth?: GridMinWidth;
  children: ReactNode;
}

export function Grid({
  as: Component = "div",
  columns = "auto",
  gap = 4,
  minWidth,
  className = "",
  children,
  ...props
}: GridProps) {
  return (
    <Component
      className={cn("ds-grid", className)}
      data-columns={columns}
      data-gap={gap}
      data-min-width={minWidth}
      {...props}
    >
      {children}
    </Component>
  );
}
