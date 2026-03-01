import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type ContainerSize = "sm" | "md" | "lg";
export type ContainerPadding = "sm" | "md";

export interface ContainerProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  size?: ContainerSize;
  padding?: ContainerPadding;
  children: ReactNode;
}

export function Container({
  as: Component = "div",
  size,
  padding,
  className = "",
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn("ds-container", className)}
      data-size={size}
      data-padding={padding}
      {...props}
    >
      {children}
    </Component>
  );
}
