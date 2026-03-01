import type { ReactNode } from "react";
import { PrimitiveBadge } from "@/design-system";

export type TelemetryHealthVariant = "success" | "warning" | "danger" | "info";

export interface TelemetryHealthStripProps {
  label: ReactNode;
  value: ReactNode;
  variant: TelemetryHealthVariant;
  details?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function TelemetryHealthStrip({
  label,
  value,
  variant,
  details,
  className,
  "aria-label": ariaLabel,
}: TelemetryHealthStripProps) {
  return (
    <div
      className={`telemetry-health-strip ${className ?? ""}`}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="telemetry-health-label text-sm text-muted">
        {label}
      </span>
      <PrimitiveBadge variant={variant} size="sm">
        {value}
      </PrimitiveBadge>
      {details ? (
        <span className="telemetry-health-details text-xs text-muted">
          {details}
        </span>
      ) : null}
    </div>
  );
}
