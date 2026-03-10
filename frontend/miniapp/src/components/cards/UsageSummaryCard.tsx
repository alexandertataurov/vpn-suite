import type { ReactNode } from "react";
import { ListCard } from "@/design-system";

export type UsageSummaryTone = "ok" | "warn" | "crit";

export interface UsageSummaryItem {
  id: string;
  label: ReactNode;
  value: ReactNode;
  tone?: UsageSummaryTone;
  progress: ReactNode;
}

export interface UsageSummaryCardProps {
  title?: ReactNode;
  items: UsageSummaryItem[];
  className?: string;
}

export function UsageSummaryCard({
  title = "Current Cycle",
  items,
  className = "",
}: UsageSummaryCardProps) {
  return (
    <ListCard title={title} className={`usage-summary-card ${className}`.trim()}>
      <div className="usage-summary-body">
        {items.map((item) => (
          <div key={item.id} className="usage-summary-row">
            <div className="usage-summary-meta">
              <div className="usage-summary-label">{item.label}</div>
              <div className={`usage-summary-value ${item.tone ?? ""}`.trim()}>{item.value}</div>
            </div>
            {item.progress}
          </div>
        ))}
      </div>
    </ListCard>
  );
}
