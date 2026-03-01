import { TelemetryBar as DsTelemetryBar, type TelemetryBarProps as DsTelemetryBarProps } from "@/design-system";
import { cn } from "@vpn-suite/shared";

export interface TelemetryBarProps {
  value: number;
  max?: number;
  thresholds?: { value: number; label?: string }[];
  /** nominal | warning | abort | standby */
  status?: "nominal" | "warning" | "abort" | "standby";
  className?: string;
  ariaLabel?: string;
}

/**
 * Aerospace design system: horizontal fill bar with threshold markers.
 */
export function TelemetryBar({
  value,
  max = 100,
  thresholds = [],
  status = "nominal",
  className = "",
  ariaLabel,
}: TelemetryBarProps) {
  const mappedStatus: DsTelemetryBarProps["status"] =
    status === "abort" ? "critical" : status;
  return (
    <DsTelemetryBar
      value={value}
      max={max}
      thresholds={thresholds}
      status={mappedStatus}
      className={cn(className)}
      aria-label={ariaLabel}
    />
  );
}
