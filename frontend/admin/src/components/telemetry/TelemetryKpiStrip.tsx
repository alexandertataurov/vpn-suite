import { TelemetryKpiGrid } from "./TelemetryKpiGrid";
import { useOperatorStrip } from "../../domain/dashboard";
import { formatBytes, formatLatencySeconds, formatPercent } from "../../domain/telemetry/formatters";
import { Skeleton } from "@vpn-suite/shared/ui";

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

  const items = [
    {
      id: "api",
      label: "API status",
      value: strip.apiStatus.toUpperCase(),
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
      value: formatPercent(strip.errorRatePct / 100),
    },
  ];

  return (
    <TelemetryKpiGrid items={items} className="mb-4" />
  );
}

