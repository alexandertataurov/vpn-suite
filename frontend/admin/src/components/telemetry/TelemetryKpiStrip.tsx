import { StatusBadge } from "@/design-system";
import { TelemetryKpiGrid } from "./TelemetryKpiGrid";
import { useOperatorStrip } from "../../domain/dashboard";
import { formatBytes, formatLatencySeconds, formatPercent } from "../../domain/telemetry/formatters";
import { Skeleton } from "@/design-system";

const ERROR_RATE_THRESHOLD = 3;

export function TelemetryKpiStrip() {
  const { strip, isLoading, isError, error } = useOperatorStrip();

  if (isLoading && !strip) {
    return <Skeleton className="h-16" />;
  }

  if (isError || !strip) {
    return (
      <p className="text-sm text-muted" role="status">
        {error instanceof Error ? error.message : "Operator KPIs unavailable"}
      </p>
    );
  }

  const apiDegraded = strip.apiStatus === "degraded";
  const errorRateAboveThreshold = strip.errorRatePct > ERROR_RATE_THRESHOLD;

  const items = [
    {
      id: "api",
      label: "API status",
      value: apiDegraded ? (
        <StatusBadge variant="critical" label="DEGRADED" pulse />
      ) : (
        strip.apiStatus.toUpperCase()
      ),
      hint: "Health of admin-api",
    },
    {
      id: "prom",
      label: "Prometheus",
      value: strip.prometheusStatus.toUpperCase(),
      hint: "Telemetry scrape pipeline",
    },
    {
      id: "nodes",
      label: "Nodes online",
      value: `${strip.onlineNodes}/${strip.totalNodes}`,
      hint: "VPN nodes online / total",
    },
    {
      id: "sessions",
      label: "Active sessions",
      value: strip.activeSessions.toLocaleString(),
    },
    {
      id: "throughput",
      label: "Cluster throughput",
      value: formatBytes(strip.totalThroughputBps) + "/s",
    },
    {
      id: "latency",
      label: "P95 latency",
      value: formatLatencySeconds(
        strip.avgLatencyMs != null ? strip.avgLatencyMs / 1000 : null
      ),
    },
    {
      id: "error-rate",
      label: "Error rate",
      value: errorRateAboveThreshold ? (
        <span className="telemetry-kpi-value-abort" title="Above threshold">
          {formatPercent(strip.errorRatePct / 100)}
          <span className="telemetry-kpi-above-threshold">↑ above threshold</span>
        </span>
      ) : (
        formatPercent(strip.errorRatePct / 100)
      ),
    },
  ];

  return (
    <TelemetryKpiGrid items={items} className="mb-4" />
  );
}
