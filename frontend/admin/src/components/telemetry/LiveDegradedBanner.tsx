import { InlineAlert } from "@/design-system";
import { useClusterLiveMetrics, useLiveConnectionState } from "../../context/LiveMetricsProvider";

export function LiveDegradedBanner() {
  const cluster = useClusterLiveMetrics();
  const connectionState = useLiveConnectionState();

  const mode = cluster?.mode ?? "normal";
  const reason = cluster?.degradation_reason;

  if (connectionState === "offline" && mode === "normal") {
    return null;
  }

  if (connectionState === "live" && mode === "normal") {
    return null;
  }

  const isCircuitOpen = mode === "circuit_open";
  const variant = isCircuitOpen ? "error" : "warning";
  const title = isCircuitOpen ? "Live stream unavailable" : "Live metrics degraded";
  const message =
    reason === "snapshot_stale"
      ? "Live metrics are based on stale snapshots; falling back to slower polling."
      : isCircuitOpen
        ? "Live metrics stream is currently unavailable. Dashboards will use cached data and REST polling."
        : "Live metrics stream is degraded. Some tiles may update less frequently.";

  return (
    <InlineAlert
      variant={variant}
      title={title}
      message={message}
      className="mb-3"
    />
  );
}

