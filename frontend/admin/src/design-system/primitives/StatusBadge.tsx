import { Badge } from "./Badge";

export type StatusBadgeVariant = "nominal" | "warning" | "critical" | "standby" | "live";
export type StatusBadgeStatus = "ok" | "degraded" | "down" | "unknown";

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  status?: StatusBadgeStatus;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const LABELS: Record<StatusBadgeVariant, string> = {
  nominal: "Nominal",
  warning: "Caution",
  critical: "Abort",
  standby: "Standby",
  live: "Live",
};

const VARIANT_MAP: Record<StatusBadgeVariant, "nominal" | "warning" | "critical" | "standby" | "accent"> = {
  nominal: "nominal",
  warning: "warning",
  critical: "critical",
  standby: "standby",
  live: "accent",
};

const STATUS_MAP: Record<StatusBadgeStatus, { variant: StatusBadgeVariant; label: string }> = {
  ok: { variant: "nominal", label: "OK" },
  degraded: { variant: "warning", label: "Degraded" },
  down: { variant: "critical", label: "Down" },
  unknown: { variant: "standby", label: "Unknown" },
};

export function StatusBadge({ variant, status, label, pulse = false, className }: StatusBadgeProps) {
  const resolved = status ? STATUS_MAP[status] : { variant: variant ?? "standby", label: label ?? "" };
  const badgeVariant = VARIANT_MAP[resolved.variant];
  const displayLabel = label ?? (status ? resolved.label : LABELS[resolved.variant]);
  return (
    <Badge variant={badgeVariant} pulse={pulse} className={className} size="sm">
      {displayLabel}
    </Badge>
  );
}

StatusBadge.displayName = "StatusBadge";
