import type { HTMLAttributes } from "react";
import { Badge as PrimitiveBadge } from "./Badge";

export type StatusBadgeStatus = "ok" | "degraded" | "down" | "unknown";

export interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: StatusBadgeStatus;
  label?: string;
}

const statusMap: Record<StatusBadgeStatus, { variant: "neutral" | "success" | "warning" | "danger"; label: string }> = {
  ok: { variant: "success", label: "OK" },
  degraded: { variant: "warning", label: "Degraded" },
  down: { variant: "danger", label: "Down" },
  unknown: { variant: "neutral", label: "Unknown" },
};

export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  const mapped = statusMap[status];
  return (
    <PrimitiveBadge variant={mapped.variant} {...props}>
      {label ?? mapped.label}
    </PrimitiveBadge>
  );
}
