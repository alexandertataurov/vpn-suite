import type { HTMLAttributes, ReactNode } from "react";

/** Plan-card usage: active | expiring | expired. Full set for backward compat. */
export type StatusChipVariant =
  | "active"
  | "expiring"
  | "expired"
  | "paid"
  | "info"
  | "pending"
  | "pend"
  | "offline"
  | "blocked"
  | "warning"
  | "danger";

function normalizeVariant(variant: StatusChipVariant) {
  return variant === "pend" ? "pending" : variant;
}

export interface StatusChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  children?: ReactNode;
  /** Alias for children */
  label?: string;
  variant?: StatusChipVariant;
}

/** Content Library 10: status chip badge. Plan-card: use active | expiring | expired. */
export function StatusChip({
  children,
  label: labelProp,
  variant = "active",
  className = "",
  ...props
}: StatusChipProps) {
  const resolvedVariant = normalizeVariant(variant);
  const label = labelProp ?? (children != null ? String(children) : "");

  return (
    <span className={`status-chip ${resolvedVariant} ${className}`.trim()} {...props}>
      <span className="status-chip-dot" aria-hidden />
      <span className="status-chip-label">{label}</span>
    </span>
  );
}
