import type { HTMLAttributes } from "react";
import { Badge as PrimitiveBadge } from "../primitives/Badge";

export type HealthBadgeStatus = "healthy" | "warning" | "degraded" | "error" | "unknown";

export interface HealthBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: HealthBadgeStatus;
  label?: string;
}

const statusMap: Record<HealthBadgeStatus, { variant: "neutral" | "success" | "warning" | "danger" | "info"; label: string }> = {
  healthy: { variant: "success", label: "Healthy" },
  warning: { variant: "warning", label: "Warning" },
  degraded: { variant: "info", label: "Degraded" },
  error: { variant: "danger", label: "Error" },
  unknown: { variant: "neutral", label: "Unknown" },
};

export function HealthBadge({ status, label, ...props }: HealthBadgeProps) {
  const mapped = statusMap[status];
  return (
    <PrimitiveBadge variant={mapped.variant} {...props}>
      {label ?? mapped.label}
    </PrimitiveBadge>
  );
}
