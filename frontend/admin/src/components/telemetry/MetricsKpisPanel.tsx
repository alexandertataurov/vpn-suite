import { useQuery } from "@tanstack/react-query";
import type { MetricsKpisOut } from "@vpn-suite/shared/types";
import { Panel, InlineAlert, Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { ANALYTICS_METRICS_KPIS_KEY } from "../../api/query-keys";
import { shouldRetryQuery } from "../../utils/queryPolicy";

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
      <Panel as="section" variant="outline" aria-label="Metrics KPIs">
        <h3 className="ref-settings-title">Metrics KPIs</h3>
        <Skeleton className="h-16" />
      </Panel>
    );
  }

  if (isError || !data) {
    return (
      <Panel as="section" variant="outline" aria-label="Metrics KPIs">
        <h3 className="ref-settings-title">Metrics KPIs</h3>
        <InlineAlert
          variant="error"
          title="Failed to load KPIs"
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </Panel>
    );
  }

  if (!data.prometheus_available) {
    return (
      <Panel as="section" variant="outline" aria-label="Metrics KPIs">
        <h3 className="ref-settings-title">Metrics KPIs</h3>
        <InlineAlert
          variant="warning"
          title="Prometheus not configured"
          message={data.message ?? "TELEMETRY_PROMETHEUS_URL is unset. Set it when monitoring profile is running."}
        />
      </Panel>
    );
  }

  return (
    <Panel as="section" variant="outline" aria-label="Metrics KPIs">
      <h3 className="ref-settings-title">Metrics KPIs</h3>
      <dl className="flex flex-wrap gap-4 sm:gap-6 text-sm">
        <div>
          <dt className="text-muted">Request rate (5m)</dt>
          <dd className="font-mono">{formatReqRate(data.request_rate_5m)}</dd>
        </div>
        <div>
          <dt className="text-muted">Error rate (5xx)</dt>
          <dd className="font-mono">{formatErrorRate(data.error_rate_5m)}</dd>
        </div>
        <div>
          <dt className="text-muted">P95 latency</dt>
          <dd className="font-mono">{formatLatency(data.latency_p95_seconds)}</dd>
        </div>
      </dl>
      {data.message ? (
        <p className="text-sm text-muted mt-2">{data.message}</p>
      ) : null}
    </Panel>
  );
}
