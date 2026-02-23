import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * Use for screen-reader-only text (e.g. icon-only button labels).
 * Renders off-screen; no keyboard change.
 */
export interface VisuallyHiddenProps {
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
}

export function VisuallyHidden({
  children,
  className,
  as: Component = "span",
}: VisuallyHiddenProps) {
  return (
    <Component className={cn("sr-only", className)}>{children}</Component>
  );
}
