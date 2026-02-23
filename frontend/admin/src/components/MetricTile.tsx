import type { LucideIcon } from "lucide-react";
import { cn } from "@vpn-suite/shared";

export type MetricTileState = "default" | "primary" | "success" | "warning" | "error";

export interface MetricTileProps {
  /** Metric label (e.g. "Active Users") */
  label: string;
  /** Main value (number or string) */
  value: string | number;
  /** Optional unit (e.g. "USD", "%") */
  unit?: string;
  /** Optional subtitle or context line */
  subtitle?: string;
  /** Optional trend for up/down/neutral with value */
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  /** Visual state (maps to metric-card variant) */
  state?: MetricTileState;
  /** Optional icon */
  icon?: LucideIcon;
  className?: string;
  "data-testid"?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  subtitle,
  trend,
  state = "default",
  icon: Icon,
  className = "",
  "data-testid": dataTestId,
}: MetricTileProps) {
  const displayValue = unit != null && unit !== "" ? `${value} ${unit}` : value;
  return (
    <div
      className={cn("metric-card", `metric-card-${state}`, className)}
      data-testid={dataTestId}
    >
      {Icon != null && (
        <div className="metric-card-bg-icon" aria-hidden>
          <Icon />
        </div>
      )}
      <div className="metric-card-content">
        {(Icon != null || label) && (
          <div className="metric-card-header">
            {Icon != null && <Icon className="metric-card-icon" aria-hidden strokeWidth={1.5} />}
            <span className="metric-card-title">{label}</span>
          </div>
        )}
        <div className="metric-card-body">
          <p className="metric-card-value">{displayValue}</p>
          {trend != null && (
            <span className={cn("metric-card-trend", `metric-card-trend-${trend.direction}`)}>
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle != null && subtitle !== "" && trend == null && (
            <p className="metric-card-meta">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
