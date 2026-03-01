import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type TimelineItemStatus = "nominal" | "warning" | "critical" | "standby";

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

export function Timeline(props: TimelineProps) {
  const { items, className = "", emptyMessage = "No events" } = props;
  if (items.length === 0) return <p className={cn("ds-timeline-empty", className)}>{emptyMessage}</p>;
  return (
    <ul className={cn("ds-timeline", className)} role="list">
      {items.map((item) => (
        <li key={item.id} className="ds-timeline__item">
          <div className={cn("ds-timeline__dot", item.status && `ds-timeline__dot--${item.status}`)} />
          <div className="ds-timeline__content">
            <span className="ds-timeline__timestamp">{item.timestamp}</span>
            <span className="ds-timeline__label">{item.label}</span>
            {item.detail != null && <span className="ds-timeline__detail">{item.detail}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

Timeline.displayName = "Timeline";
