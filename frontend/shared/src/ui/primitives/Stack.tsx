import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveStackDirection = "vertical" | "horizontal";
export type PrimitiveStackAlign = "start" | "center" | "end" | "stretch";
export type PrimitiveStackJustify = "start" | "center" | "end" | "between";

export interface PrimitiveStackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: PrimitiveStackDirection;
  gap?: string;
  align?: PrimitiveStackAlign;
  justify?: PrimitiveStackJustify;
  wrap?: boolean;
  children: ReactNode;
}

export function Stack({
  direction = "vertical",
  gap,
  align,
  justify,
  wrap,
  className = "",
  children,
  ...props
}: PrimitiveStackProps) {
  return (
    <div
      className={cn("ds-stack", className)}
      data-direction={direction}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? "true" : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
