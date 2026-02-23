import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveTextVariant = "body" | "label" | "caption" | "code" | "muted";

export interface PrimitiveTextProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  variant?: PrimitiveTextVariant;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

export function Text({ variant = "body", as: Component = "span", className = "", children, ...props }: PrimitiveTextProps) {
  return (
    <Component className={cn("ds-text", className)} data-variant={variant} {...props}>
      {children}
    </Component>
  );
}
