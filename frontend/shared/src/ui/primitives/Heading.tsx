import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveHeadingVariant = "title";

export interface PrimitiveHeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "children"> {
  variant?: PrimitiveHeadingVariant;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

export function Heading({ variant = "title", as: Component = "h2", className = "", children, ...props }: PrimitiveHeadingProps) {
  return (
    <Component className={cn("ds-heading", className)} data-variant={variant} {...props}>
      {children}
    </Component>
  );
}
