import { useQuery } from "@tanstack/react-query";
import type { MetricsKpisOut, TelemetryServicesOut } from "@vpn-suite/shared/types";
import { api } from "../../../api/client";
import { ANALYTICS_METRICS_KPIS_KEY, ANALYTICS_TELEMETRY_SERVICES_KEY } from "../../../api/query-keys";
import { getTelemetryErrorMessage } from "../../../utils/telemetry-freshness";
import { shouldRetryQuery } from "../../../utils/queryPolicy";
import { getJson, toTelemetryError } from "../telemetryClient";

export function useMetricsKpis() {
  const query = useQuery<MetricsKpisOut>({
    queryKey: ANALYTICS_METRICS_KPIS_KEY,
    queryFn: ({ signal }) => api.get<MetricsKpisOut>("/analytics/metrics/kpis", { signal }),
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: shouldRetryQuery,
  });
  const errorMessage = query.isError ? getTelemetryErrorMessage(query.error, "Could not load metrics KPIs") : null;
  return { ...query, errorMessage };
}

export function useTelemetryServices() {
  const query = useQuery<TelemetryServicesOut>({
    queryKey: ANALYTICS_TELEMETRY_SERVICES_KEY,
    queryFn: ({ signal }) => getJson<TelemetryServicesOut>("/analytics/telemetry/services", { signal }),
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: shouldRetryQuery,
  });
  const normalizedError = query.isError ? toTelemetryError(query.error, "/analytics/telemetry/services") : null;
  const errorMessage = query.isError ? getTelemetryErrorMessage(query.error, "Could not load scrape status") : null;
  return { ...query, normalizedError, errorMessage };
}

