import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveContainerSize = "sm" | "md" | "lg";
export type PrimitiveContainerPadding = "sm" | "md";

export interface PrimitiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: PrimitiveContainerSize;
  padding?: PrimitiveContainerPadding;
  children: ReactNode;
}

export function Container({ size = "md", padding = "md", className = "", children, ...props }: PrimitiveContainerProps) {
  return (
    <div className={cn("ds-container", className)} data-size={size} data-padding={padding} {...props}>
      {children}
    </div>
  );
}
