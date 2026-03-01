import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../utils/cn";

export type PrimitiveBadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";
export type PrimitiveBadgeSize = "sm" | "md";

export interface PrimitiveBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PrimitiveBadgeVariant;
  size?: PrimitiveBadgeSize;
  asChild?: boolean;
  children?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, PrimitiveBadgeProps>(function Badge(
  { variant = "neutral", size = "md", asChild = false, className = "", children, ...props },
  ref
) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp ref={ref} className={cn("ds-badge", className)} data-variant={variant} data-size={size} {...props}>
      {children}
    </Comp>
  );
});
