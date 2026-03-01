import { PrimitiveBadge, InlineAlert } from "@/design-system";
import { formatDateTime } from "@vpn-suite/shared";

export type ApiHealthStatus = "ok" | "degraded" | "down" | "unknown";

export interface DataSourceHealthStripProps {
  /** Inferred from last request success */
  apiStatus: ApiHealthStatus;
  /** Last successful fetch timestamp (ISO string or ms) */
  lastSuccessfulFetch: string | number | null;
  /** e.g. "15s" */
  refreshInterval: string;
  /** e.g. "Last 15m" or "—" */
  timeRange?: string;
  /** Offline detection */
  isOffline?: boolean;
  /** Show as inferred (no explicit health endpoint) */
  inferred?: boolean;
  className?: string;
}

function statusToVariant(s: ApiHealthStatus): "success" | "warning" | "danger" | "info" {
  switch (s) {
    case "ok":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "danger";
    default:
      return "info";
  }
}

function statusToLabel(s: ApiHealthStatus): string {
  switch (s) {
    case "ok":
      return "OK";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "Unknown";
  }
}

export function DataSourceHealthStrip({
  apiStatus,
  lastSuccessfulFetch,
  refreshInterval,
  timeRange = "—",
  isOffline = false,
  inferred = true,
  className = "",
}: DataSourceHealthStripProps) {
  const lastLabel = lastSuccessfulFetch
    ? formatDateTime(
        typeof lastSuccessfulFetch === "number"
          ? new Date(lastSuccessfulFetch)
          : lastSuccessfulFetch
      )
    : "Never";

  if (isOffline) {
    return (
      <InlineAlert
        variant="warning"
        title="You are offline"
        message="Telemetry data cannot be refreshed until the connection is restored."
        className={className}
      />
    );
  }

  return (
    <div
      className={`data-source-health-strip ${className}`}
      role="status"
      aria-label="Data source health"
    >
      <span className="data-source-health-strip-label">
        <span className="data-source-health-strip-text">API:</span>
        <PrimitiveBadge variant={statusToVariant(apiStatus)}>{statusToLabel(apiStatus)}</PrimitiveBadge>
        {inferred && (
          <span className="data-source-health-strip-muted" title="Status inferred from request success">
            (inferred)
          </span>
        )}
      </span>
      <span className="data-source-health-strip-text">
        Last updated: <strong>{lastLabel}</strong>
      </span>
      <span className="data-source-health-strip-text">Refresh: {refreshInterval}</span>
      <span className="data-source-health-strip-text">Range: {timeRange}</span>
    </div>
  );
}
