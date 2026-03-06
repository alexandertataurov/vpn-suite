import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type HelperTextVariant = "hint" | "error";

export interface HelperTextProps {
  variant?: HelperTextVariant;
  className?: string;
  children?: ReactNode;
  id?: string;
  role?: "alert";
}

const variantClass: Record<HelperTextVariant, string> = {
  hint: "typo-helper-hint",
  error: "typo-helper-error",
};

export function HelperText({
  variant = "hint",
  className = "",
  children,
  ...props
}: HelperTextProps) {
  return (
    <span className={cn(variantClass[variant], className)} {...props}>
      {children}
    </span>
  );
}
