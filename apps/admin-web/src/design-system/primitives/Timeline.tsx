import type { ReactNode } from "react";

type TimelineVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface TimelineEvent {
  id: string;
  title: ReactNode;
  time?: ReactNode;
  description?: ReactNode;
  actor?: ReactNode;
  variant?: TimelineVariant;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className = "" }: TimelineProps) {
  if (!events.length) return null;

  return (
    <div className={["timeline", className || null].filter(Boolean).join(" ")}>
      {events.map((event, index) => {
        const variant = event.variant ?? "neutral";
        const dotClass = ["timeline-dot", variant].join(" ");
        return (
          <div key={event.id ?? index} className="timeline-item">
            <div className="timeline-track">
              <div className={dotClass} />
            </div>
            <div className="timeline-body">
              <div className="timeline-header">
                <span className="timeline-title">{event.title}</span>
                {event.time && <span className="timeline-time">{event.time}</span>}
              </div>
              {event.description && <div className="timeline-content">{event.description}</div>}
              {event.actor && <div className="timeline-actor">{event.actor}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

