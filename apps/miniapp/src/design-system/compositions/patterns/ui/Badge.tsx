import type { HTMLAttributes } from "react";

export type BadgeVariant = "warning" | "error" | "muted" | "success";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label: string;
  variant: BadgeVariant;
}

/** Inline badge for status indicators (e.g. "7d left", "Full"). */
export function Badge({ label, variant, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`badge badge--${variant} ${className}`.trim()}
      data-layer="Badge"
      {...props}
    >
      {label}
    </span>
  );
}
