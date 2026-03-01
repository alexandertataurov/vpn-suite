import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type TimelineItemStatus = "nominal" | "warning" | "abort" | "standby";

export interface TimelineItem {
  id: string;
  timestamp: string;
  status?: TimelineItemStatus;
  label: ReactNode;
  detail?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  emptyMessage?: string;
}

/**
 * Aerospace design system: vertical event log with timestamp + status dot.
 */
export function Timeline({
  items,
  className = "",
  emptyMessage = "No events",
}: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className={cn("timeline-empty", className)}>{emptyMessage}</p>
    );
  }
  return (
    <ul className={cn("timeline", className)} role="list">
      {items.map((item) => (
        <li key={item.id} className="timeline__item">
          <div className={cn("timeline__dot", item.status && `timeline__dot--${item.status}`)} />
          <div className="timeline__content">
            <span className="timeline__timestamp font-data">{item.timestamp}</span>
            <span className="timeline__label">{item.label}</span>
            {item.detail != null && (
              <span className="timeline__detail">{item.detail}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
