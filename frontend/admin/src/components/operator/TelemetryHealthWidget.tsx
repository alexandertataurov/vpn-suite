import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import type { TelemetrySnapshotOut } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { TELEMETRY_SNAPSHOT_KEY } from "../../api/query-keys";
import { FreshnessBadge } from "./FreshnessBadge";
import { RelativeTime } from "@vpn-suite/shared/ui";
import { Skeleton } from "@vpn-suite/shared/ui";

export function TelemetryHealthWidget() {
  const { data, isLoading, isError } = useQuery<TelemetrySnapshotOut>({
    queryKey: [...TELEMETRY_SNAPSHOT_KEY, "meta", "nodes.summary"],
    queryFn: ({ signal }) =>
      api.get<TelemetrySnapshotOut>(
        "/telemetry/snapshot?scope=all&fields=meta,nodes.summary",
        { signal }
      ),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="telemetry-health-widget" data-testid="telemetry-health-widget">
        <div className="operator-section-title">
          <Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Telemetry health
        </div>
        <Skeleton height={56} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="telemetry-health-widget" data-testid="telemetry-health-widget">
        <div className="operator-section-title">
          <Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Telemetry health
        </div>
        <p className="operator-health-label">—</p>
      </div>
    );
  }

  const meta = data.meta;
  const nodes = data.nodes?.summary;
  const freshness = meta.freshness === "unknown" ? "stale" : meta.freshness;
  const pillLabel = freshness === "fresh" ? "Fresh" : freshness === "degraded" ? "Delayed" : "Stale";
  const pillTitle =
    freshness === "stale"
      ? "Stale: no data >2m. Check Prometheus/telemetry pipeline."
      : freshness === "degraded"
        ? "Delayed: data older than 30s."
        : "Fresh: data under 30s.";

  return (
    <div className="telemetry-health-widget" data-testid="telemetry-health-widget">
      {freshness === "stale" && (
        <div className="telemetry-health-widget-banner" role="status">
          Telemetry data is stale. Check Prometheus/telemetry pipeline.
        </div>
      )}
      <div className="operator-section-title">
        <Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
        Telemetry health
      </div>
      <div className="telemetry-health-strip">
        <span className="operator-health-label">
          Last snapshot:{" "}
          {meta.snapshot_ts ? (
            <RelativeTime
              date={new Date(meta.snapshot_ts * 1000)}
              updateInterval={5000}
              title={new Date(meta.snapshot_ts * 1000).toISOString()}
            />
          ) : (
            "—"
          )}
        </span>
        <FreshnessBadge freshness={freshness} title={pillTitle}>
          {pillLabel}
        </FreshnessBadge>
        {nodes ? (
          <span className="operator-health-label">
            Nodes: {nodes.online} OK / {nodes.degraded} degraded / {nodes.down} down
            {meta.stale_node_ids.length > 0 && ` · ${meta.stale_node_ids.length} stale`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
