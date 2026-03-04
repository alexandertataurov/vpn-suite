import type { HTMLAttributes } from "react";
import { STATUS_TOKENS, type StatusVariant } from "../../statusMap";
import { Badge as PrimitiveBadge } from "./Badge";

export type StatusBadgeStatus = StatusVariant;

export interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: StatusBadgeStatus;
  label?: string;
}

export function StatusBadge({ status, label, className = "", ...props }: StatusBadgeProps) {
  const mapped = STATUS_TOKENS[status];
  return (
    <PrimitiveBadge
      variant="neutral"
      className={`status-badge ${className}`}
      data-status={status}
      {...props}
    >
      {label ?? mapped.label}
    </PrimitiveBadge>
  );
}
