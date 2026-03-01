import { cn } from "@vpn-suite/shared";

export type TelemetryBarStatus = "nominal" | "warning" | "critical" | "standby";

export interface TelemetryBarProps {
  value: number;
  max?: number;
  thresholds?: { value: number; label?: string }[];
  status?: TelemetryBarStatus;
  className?: string;
  "aria-label"?: string;
}

export function TelemetryBar({
  value,
  max = 100,
  thresholds = [],
  status = "nominal",
  className,
  "aria-label": ariaLabel,
}: TelemetryBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn("ds-telemetry-bar", `ds-telemetry-bar--${status}`, className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel ?? `Progress: ${value} of ${max}`}
      style={{ "--telemetry-bar-progress": `${pct / 100}` } as React.CSSProperties & { "--telemetry-bar-progress": string }}
    >
      <div className="ds-telemetry-bar__track">
        <div className="ds-telemetry-bar__fill" />
        {thresholds.map((t, i) => (
          <div
            key={i}
            className="ds-telemetry-bar__threshold"
            style={{ "--telemetry-bar-threshold": `${Math.min(100, (t.value / max) * 100)}%` } as React.CSSProperties & { "--telemetry-bar-threshold": string }}
            title={t.label}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

TelemetryBar.displayName = "TelemetryBar";
