import type { ReactNode } from "react";
import { Panel } from "@vpn-suite/shared/ui";
import { cn } from "@vpn-suite/shared";

export interface DataCardProps {
  title: ReactNode;
  value: ReactNode;
  trend?: ReactNode;
  freshness?: ReactNode;
  className?: string;
}

export function DataCard({ title, value, trend, freshness, className }: DataCardProps) {
  return (
    <Panel variant="surface" className={cn("data-card", className)}>
      <div className="data-card__header">
        <span className="data-card__title">{title}</span>
        {freshness != null ? <span className="data-card__freshness">{freshness}</span> : null}
      </div>
      <div className="data-card__body">
        <span className="data-card__value">{value}</span>
        {trend != null ? <span className="data-card__trend">{trend}</span> : null}
      </div>
    </Panel>
  );
}
