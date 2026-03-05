import type { HTMLAttributes, ReactNode } from "react";

export type StatusBadgeTone = "neutral" | "success" | "danger";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: StatusBadgeTone;
  children: ReactNode;
}

export function StatusBadge({
  status = "neutral",
  children,
  className = "",
  ...props
}: StatusBadgeProps) {
  const badgeStatus = status === "neutral" ? undefined : status;
  return (
    <span
      className={`ds-status-badge ${className}`.trim()}
      data-status={badgeStatus}
      {...props}
    >
      {children}
    </span>
  );
}
