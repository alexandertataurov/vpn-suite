import { useQuery } from "@tanstack/react-query";
import type { MetricsKpisOut } from "@vpn-suite/shared/types";
import { InlineAlert, Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { ANALYTICS_METRICS_KPIS_KEY } from "../../api/query-keys";
import { getTelemetryErrorMessage } from "../../utils/telemetry-freshness";
import { shouldRetryQuery } from "../../utils/queryPolicy";
import { TelemetrySection } from "./TelemetrySection";
import { TelemetryKpiGrid } from "./TelemetryKpiGrid";

function formatReqRate(v: number | null): string {
  if (v == null) return "—";
  return `${v.toFixed(2)} req/s`;
}

function formatErrorRate(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

function formatLatency(v: number | null): string {
  if (v == null) return "—";
  return v >= 1 ? `${v.toFixed(2)}s` : `${(v * 1000).toFixed(0)}ms`;
}

export function MetricsKpisPanel() {
  const { data, isLoading, isError, error } = useQuery<MetricsKpisOut>({
    queryKey: ANALYTICS_METRICS_KPIS_KEY,
    queryFn: ({ signal }) => api.get<MetricsKpisOut>("/analytics/metrics/kpis", { signal }),
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: shouldRetryQuery,
  });

  if (isLoading) {
    return (
      <TelemetrySection title="Metrics KPIs" ariaLabel="Metrics KPIs">
        <Skeleton className="h-16" />
      </TelemetrySection>
    );
  }

  if (isError || !data) {
    return (
      <TelemetrySection title="Metrics KPIs" ariaLabel="Metrics KPIs">
        <InlineAlert
          variant="error"
          title="Failed to load KPIs"
          message={getTelemetryErrorMessage(error, "Could not load metrics KPIs")}
        />
      </TelemetrySection>
    );
  }

  if (!data.prometheus_available) {
    return (
      <TelemetrySection title="Metrics KPIs" ariaLabel="Metrics KPIs">
        <InlineAlert
          variant="warning"
          title="Prometheus not configured"
          message={data.message ?? "TELEMETRY_PROMETHEUS_URL is unset. Set it when monitoring profile is running."}
        />
      </TelemetrySection>
    );
  }

  return (
    <TelemetrySection title="Metrics KPIs" ariaLabel="Metrics KPIs">
      <TelemetryKpiGrid
        items={[
          {
            id: "req-rate",
            label: "Request rate (5m)",
            value: formatReqRate(data.request_rate_5m),
          },
          {
            id: "error-rate",
            label: "Error rate (5xx)",
            value: formatErrorRate(data.error_rate_5m),
          },
          {
            id: "latency-p95",
            label: "P95 latency",
            value: formatLatency(data.latency_p95_seconds),
          },
        ]}
      />
      {data.message ? (
        <p className="text-sm text-muted mt-2">{data.message}</p>
      ) : null}
    </TelemetrySection>
  );
}
