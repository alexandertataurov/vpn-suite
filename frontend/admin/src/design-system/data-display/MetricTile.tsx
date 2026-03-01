import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import type { LucideIcon } from "../icons";
import type { StatusBadgeVariant } from "../primitives/StatusBadge";

/** Legacy state prop — maps to status for backward compat. */
export type MetricTileState = "default" | "primary" | "success" | "warning" | "error";

function stateToStatus(state?: MetricTileState): StatusBadgeVariant | undefined {
  if (!state || state === "default" || state === "primary") return undefined;
  if (state === "success") return "nominal";
  if (state === "warning") return "warning";
  if (state === "error") return "critical";
  return undefined;
}

type TrendProp = "up" | "down" | { value: number; direction: "up" | "down" | "neutral" };

export interface MetricTileProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  unit?: string;
  status?: StatusBadgeVariant;
  /** Legacy: maps to status (success->nominal, warning->warning, error->critical). */
  state?: MetricTileState;
  trend?: TrendProp;
  trendValue?: string;
  icon?: LucideIcon;
  sparkline?: ReactNode;
  pulse?: boolean;
  aboveThreshold?: boolean;
  "data-testid"?: string;
  className?: string;
}

export function MetricTile(p: MetricTileProps) {
  const status = p.status ?? stateToStatus(p.state);
  const trendDir = typeof p.trend === "object" ? (p.trend.direction === "neutral" ? undefined : p.trend.direction) : p.trend;
  const displayTrendValue = typeof p.trend === "object" ? `${Math.abs(p.trend.value)}%` : p.trendValue;
  const Icon = p.icon;
  return (
    <div className={cn("ds-metric-tile", p.className)} data-testid={p["data-testid"]}>
      <div className="ds-metric-tile__header">
        {Icon != null && <Icon className="ds-metric-tile__icon" aria-hidden strokeWidth={1.5} />}
        <span className="ds-metric-tile__label">{p.label}</span>
        {displayTrendValue != null && <span className={cn("ds-metric-tile__delta", trendDir === "up" && "ds-metric-tile__delta--up", trendDir === "down" && "ds-metric-tile__delta--down")}>{displayTrendValue}</span>}
      </div>
      <div className="ds-metric-tile__body">
        <span className={cn("ds-metric-tile__value", status && `ds-metric-tile__value--${status}`, p.pulse && "ds-metric-tile__value--pulse")}>
          {p.pulse && <span className="ds-metric-tile__pulse-dot" aria-hidden />}
          {p.value}{p.unit != null && <span className="ds-metric-tile__unit">{p.unit}</span>}
        </span>
        {p.aboveThreshold && <span className="ds-metric-tile__above-threshold">↑ above threshold</span>}
        {p.subtitle != null && <span className="ds-metric-tile__subtitle">{p.subtitle}</span>}
        {p.sparkline != null && <div className="ds-metric-tile__sparkline" aria-hidden>{p.sparkline}</div>}
      </div>
    </div>
  );
}

MetricTile.displayName = "MetricTile";
