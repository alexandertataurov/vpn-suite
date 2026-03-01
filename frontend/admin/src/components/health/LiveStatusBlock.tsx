import { useState, useCallback, useMemo } from "react";
import { IconRefresh } from "@/design-system/icons";
import { RelativeTime } from "@/design-system";
import { Button } from "@/design-system";

type Freshness = "fresh" | "degraded" | "stale" | "unknown";

export interface LiveStatusBlockProps {
  last_updated: string;
  freshness: Freshness;
  apiDegraded?: boolean;
  onRefresh: () => void;
}

function formatSyncTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const s = d.getUTCSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function dotModifier(freshness: Freshness, apiDegraded?: boolean): string {
  if (apiDegraded) return "admin-live-dot--abort";
  if (freshness === "fresh") return "admin-live-dot--fresh";
  if (freshness === "degraded") return "admin-live-dot--degraded";
  if (freshness === "stale") return "admin-live-dot--stale";
  return "admin-live-dot--unknown";
}

export function LiveStatusBlock({ last_updated, freshness, apiDegraded, onRefresh }: LiveStatusBlockProps) {
  const [spinning, setSpinning] = useState(false);
  const syncTimeStr = useMemo(() => formatSyncTime(last_updated), [last_updated]);

  const handleRefresh = useCallback(() => {
    onRefresh();
    setSpinning(true);
  }, [onRefresh]);

  const handleAnimationEnd = useCallback(() => setSpinning(false), []);

  const isStale = freshness === "stale" || freshness === "degraded";

  return (
    <div
      className={`admin-live-status-block${apiDegraded ? " admin-live-status-block--api-degraded" : ""}${isStale && !apiDegraded ? " admin-live-status-block--stale" : ""}`}
      role="status"
      aria-label={apiDegraded ? "API degraded" : `Last sync ${syncTimeStr} UTC. Dashboard auto-refresh every 15s.`}
      title={apiDegraded ? "API degraded — admin-api is responding slowly or with errors." : `Last sync ${syncTimeStr} UTC (Prometheus scrape).`}
    >
      <span className={`admin-live-dot live-dot admin-live-dot--topbar ${dotModifier(freshness, apiDegraded)}${apiDegraded || freshness === "fresh" ? " admin-live-dot--pulse" : ""}`} aria-hidden />
      <span className="admin-live-status-text">{apiDegraded ? "API DEGRADED" : "Live (15s)"}</span>
      <span className="admin-live-updated" aria-hidden>
        Last Sync: {syncTimeStr} UTC (<RelativeTime date={last_updated} updateInterval={30000} title={new Date(last_updated).toISOString()} />)
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        onAnimationEnd={handleAnimationEnd}
        aria-label="Refresh dashboard"
        className={`admin-refresh-btn${spinning ? " admin-refresh-btn--spin" : ""}`}
      >
        <IconRefresh size={14} strokeWidth={1.5} aria-hidden />
      </Button>
    </div>
  );
}
