import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface SectionContainerProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div";
  children: ReactNode;
}

export function SectionContainer({
  as: Component = "section",
  className = "",
  children,
  ...props
}: SectionContainerProps) {
  return (
    <Component className={cn("ds-section-container", className)} {...props}>
      {children}
    </Component>
  );
}
