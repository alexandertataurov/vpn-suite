import type { HTMLAttributes, ReactNode } from "react";

export type StatusChipVariant = "active" | "paid" | "info" | "pend" | "offline";

export interface StatusChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  children: ReactNode;
  variant?: StatusChipVariant;
}

/** Content Library 10: status chip badge. */
export function StatusChip({
  children,
  variant = "active",
  className = "",
  ...props
}: StatusChipProps) {
  return (
    <span className={`status-chip ${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
