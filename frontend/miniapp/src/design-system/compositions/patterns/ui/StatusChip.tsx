import type { HTMLAttributes, ReactNode } from "react";

export type StatusChipVariant = "active" | "paid" | "info" | "pending" | "pend" | "offline" | "blocked" | "warning" | "danger";

function normalizeVariant(variant: StatusChipVariant) {
  return variant === "pend" ? "pending" : variant;
}

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
  const resolvedVariant = normalizeVariant(variant);

  return (
    <span className={`status-chip ${resolvedVariant} ${className}`.trim()} {...props}>
      <span className="status-chip-dot" aria-hidden />
      <span className="status-chip-label">{children}</span>
    </span>
  );
}
