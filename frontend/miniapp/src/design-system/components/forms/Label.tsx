import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface LabelProps {
  required?: boolean;
  as?: ElementType;
  htmlFor?: string;
  className?: string;
  children?: ReactNode;
}

export function Label({
  required,
  as: Component = "label",
  htmlFor,
  className = "",
  children,
  ...props
}: LabelProps) {
  return (
    <Component
      className={cn("typo-label", className)}
      {...(Component === "label" && htmlFor != null ? { htmlFor } : {})}
      {...props}
    >
      {children}
      {required ? <span aria-hidden> *</span> : null}
    </Component>
  );
}
