import type { ReactNode } from "react";
import { Card } from "@/design-system";
import { cn } from "@vpn-suite/shared";
import type { LucideIcon } from "@/design-system/icons";
import type { StatusBadgeVariant } from "@/design-system";

/** Legacy state prop — maps to status for backward compat. */
export type MetricTileState = "default" | "primary" | "success" | "warning" | "error";

function stateToStatus(state?: MetricTileState): StatusBadgeVariant | undefined {
  if (!state || state === "default" || state === "primary") return undefined;
  if (state === "success") return "nominal";
  if (state === "warning") return "warning";
  if (state === "error") return "critical";
  return undefined;
}

export interface MetricTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  status?: StatusBadgeVariant;
  /** Legacy: maps to status (success->nominal, warning->warning, error->abort). */
  state?: MetricTileState;
  trend?: "up" | "down" | "flat" | { value: number; direction: "up" | "down" | "neutral" };
  trendValue?: string;
  pulse?: boolean;
  aboveThreshold?: boolean;
  delta?: { value: string; direction: "up" | "down" | "neutral" };
  sparkline?: ReactNode;
  icon?: LucideIcon;
  subtitle?: string;
  "data-testid"?: string;
  className?: string;
}

/**
 * Aerospace design system: KPI tile with font-data value.
 */
export function MetricTile({
  label,
  value,
  unit,
  status: statusProp,
  state,
  trend,
  trendValue,
  pulse,
  aboveThreshold,
  delta,
  sparkline,
  icon: Icon,
  subtitle,
  "data-testid": dataTestId,
  className = "",
}: MetricTileProps) {
  const status = statusProp ?? stateToStatus(state);
  const trendDir = typeof trend === "object" ? (trend.direction === "neutral" ? "flat" : trend.direction) : trend;
  const displayTrend = trendDir ?? (delta ? (delta.direction === "neutral" ? "flat" : delta.direction) : undefined);
  const displayTrendValue = typeof trend === "object" ? String(Math.abs(trend.value)) + "%" : trendValue ?? delta?.value;
  return (
    <Card variant="surface" className={cn("metric-tile", className)} data-testid={dataTestId}>
      <div className="metric-tile__header">
        {Icon != null && <Icon className="metric-tile__icon" aria-hidden strokeWidth={1.5} />}
        <span className="metric-tile__label">{label}</span>
        {(displayTrendValue != null || displayTrend != null) && (
          <span
            className={cn(
              "metric-tile__delta",
              displayTrend === "up" && "metric-tile__delta--up",
              displayTrend === "down" && "metric-tile__delta--down"
            )}
          >
            {displayTrendValue}
          </span>
        )}
      </div>
      <div className="metric-tile__body">
        <span
          className={cn(
            "metric-tile__value font-data",
            status && `metric-tile__value--${status}`,
            pulse && "metric-tile__value--pulse"
          )}
        >
          {pulse ? <span className="metric-tile__pulse-dot" aria-hidden /> : null}
          {value}
          {unit != null && <span className="metric-tile__unit">{unit}</span>}
        </span>
        {aboveThreshold && (
          <span className="metric-tile__above-threshold">↑ above threshold</span>
        )}
        {subtitle != null && <p className="metric-tile__subtitle">{subtitle}</p>}
        {sparkline != null && <div className="metric-tile__sparkline" aria-hidden>{sparkline}</div>}
      </div>
    </Card>
  );
}
