import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { RelativeTime } from "@vpn-suite/shared/ui";
import { Button } from "@vpn-suite/shared/ui";

type Freshness = "fresh" | "degraded" | "stale" | "unknown";

export interface LiveStatusBlockProps {
  last_updated: string;
  freshness: Freshness;
  onRefresh: () => void;
}

function dotModifier(freshness: Freshness): string {
  if (freshness === "fresh") return "admin-live-dot--fresh";
  if (freshness === "degraded") return "admin-live-dot--degraded";
  if (freshness === "stale") return "admin-live-dot--stale";
  return "admin-live-dot--unknown";
}

export function LiveStatusBlock({ last_updated, freshness, onRefresh }: LiveStatusBlockProps) {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = useCallback(() => {
    onRefresh();
    setSpinning(true);
  }, [onRefresh]);

  const handleAnimationEnd = useCallback(() => setSpinning(false), []);

  const isStale = freshness === "stale" || freshness === "degraded";

  return (
    <div
      className={`admin-live-status-block${isStale ? " admin-live-status-block--stale" : ""}`}
      role="status"
      aria-label={`Live data${isStale ? ", data may be delayed" : ""}. Dashboard auto-refresh every 15s (Prometheus scrape).`}
      title="Dashboard auto-refresh every 15s (synced with Prometheus scrape)."
    >
      <span className={`admin-live-dot admin-live-dot--topbar ${dotModifier(freshness)}${freshness === "fresh" ? " admin-live-dot--pulse" : ""}`} aria-hidden />
      <span className="admin-live-status-text">Live (15s)</span>
      <span className="admin-live-updated" aria-hidden>
        Updated <RelativeTime date={last_updated} updateInterval={5000} title={new Date(last_updated).toISOString()} />
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        onAnimationEnd={handleAnimationEnd}
        aria-label="Refresh dashboard"
        className={`admin-refresh-btn${spinning ? " admin-refresh-btn--spin" : ""}`}
      >
        <RefreshCw size={14} strokeWidth={2} aria-hidden />
      </Button>
    </div>
  );
}
