/**
 * Telemetry-first freshness: badge + last updated + optional reason.
 * Use in every data card that has a freshness concept.
 */
import { RelativeTime } from "@vpn-suite/shared/ui";
import { FreshnessBadge } from "./FreshnessBadge";
import type { Freshness } from "../../domain/dashboard/types";

export interface DataFreshnessBadgeProps {
  freshness: Freshness;
  lastUpdated?: string | null;
  reason?: string | null;
  className?: string;
}

function getReason(f: Freshness): string {
  switch (f) {
    case "fresh": return "Data under 30s.";
    case "degraded": return "Delayed: data older than 30s.";
    case "stale": return "Stale: no data >2m. Check Prometheus/telemetry pipeline.";
    default: return "Freshness unknown.";
  }
}

export function DataFreshnessBadge({
  freshness,
  lastUpdated,
  reason,
  className,
}: DataFreshnessBadgeProps) {
  const displayFreshness = freshness === "unknown" ? "stale" : freshness;
  const label = displayFreshness === "fresh" ? "Fresh" : displayFreshness === "degraded" ? "Delayed" : "Stale";
  const title = reason ?? getReason(freshness);
  return (
    <span className={className} role="status">
      <FreshnessBadge
        freshness={displayFreshness}
        title={title}
      >
        {label}
      </FreshnessBadge>
      {lastUpdated && (
        <span className="admin-live-updated operator-health-label" style={{ marginLeft: "var(--spacing-op-2, 8px)" }}>
          Updated <RelativeTime date={lastUpdated} updateInterval={5000} title={new Date(lastUpdated).toISOString()} />
        </span>
      )}
    </span>
  );
}
