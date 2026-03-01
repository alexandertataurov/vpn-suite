import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
}

export function VisuallyHidden({ children, className, as: Component = "span" }: VisuallyHiddenProps) {
  return <Component className={cn("sr-only", className)}>{children}</Component>;
}
