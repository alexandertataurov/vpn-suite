import { cn } from "../../utils/cn";

export type LiveIndicatorStatus = "live" | "paused" | "reconnecting" | "error";

export interface LiveIndicatorProps {
  status: LiveIndicatorStatus;
  className?: string;
  "data-testid"?: string;
}

const statusLabel: Record<LiveIndicatorStatus, string> = {
  live: "Live",
  paused: "Paused",
  reconnecting: "Reconnecting",
  error: "Error",
};

export function LiveIndicator({
  status,
  className,
  "data-testid": dataTestId,
}: LiveIndicatorProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={statusLabel[status]}
      className={cn("live-indicator", `live-indicator--${status}`, className)}
      data-testid={dataTestId}
    >
      <span aria-hidden className="live-indicator-dot" />
      {statusLabel[status]}
    </span>
  );
}
