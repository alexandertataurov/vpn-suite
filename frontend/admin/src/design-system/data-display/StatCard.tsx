import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  sparkline?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, sparkline, className }: StatCardProps) {
  return (
    <div className={cn("ds-stat-card", className)}>
      <span className="ds-stat-card__label">{label}</span>
      <span className="ds-stat-card__value">{value}</span>
      {sparkline != null && <div className="ds-stat-card__sparkline" aria-hidden>{sparkline}</div>}
    </div>
  );
}

StatCard.displayName = "StatCard";
