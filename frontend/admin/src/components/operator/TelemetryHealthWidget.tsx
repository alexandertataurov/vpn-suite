import { Activity } from "lucide-react";
import { Button } from "@vpn-suite/shared/ui";
import { getTelemetryErrorMessage } from "../../utils/telemetry-freshness";
import { FreshnessBadge } from "./FreshnessBadge";
import { RelativeTime, Skeleton } from "@vpn-suite/shared/ui";
import { useTelemetrySnapshotMeta } from "../../domain/telemetry/hooks/useSnapshotTelemetry";

export function TelemetryHealthWidget() {
  const { data, isLoading, isError, error, refetch } = useTelemetrySnapshotMeta();

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
        <p className="operator-health-label">{getTelemetryErrorMessage(error, "Snapshot unavailable")}</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()} aria-label="Retry telemetry snapshot">
          Retry
        </Button>
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
            {(meta.stale_node_ids?.length ?? 0) > 0 && ` · ${meta.stale_node_ids?.length ?? 0} stale`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
