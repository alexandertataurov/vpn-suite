import { cn } from "@vpn-suite/shared";

export interface LiveBadgeProps {
  className?: string;
}

export function LiveBadge({ className }: LiveBadgeProps) {
  return (
    <span
      className={cn("ds-live-badge", className)}
      role="status"
      aria-live="polite"
    >
      <span className="ds-live-badge__dot" aria-hidden />
      LIVE
    </span>
  );
}

LiveBadge.displayName = "LiveBadge";
