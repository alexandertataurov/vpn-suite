/**
 * Canonical React Query hooks for dashboard. Keys, staleTime, refetchInterval aligned.
 * All widgets should use these hooks and domain selectors, not raw api.get.
 */
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { OperatorDashboardOut } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { OPERATOR_DASHBOARD_KEY } from "../../api/query-keys";
import { shouldRetryQuery } from "../../utils/queryPolicy";
import { selectHealthStrip, selectIncidents } from "./selectors";
import type { StripView } from "./types";

const STALE_MS = 2_000;
const REFETCH_INTERVAL_MS = 2_000;

export interface UseOperatorOverviewOptions {
  refetchInterval?: UseQueryOptions<OperatorDashboardOut, Error>["refetchInterval"];
}

export function useOperatorOverview(timeRange: string, options?: UseOperatorOverviewOptions) {
  return useQuery<OperatorDashboardOut>({
    queryKey: [...OPERATOR_DASHBOARD_KEY, timeRange],
    queryFn: ({ signal }) =>
      api.get<OperatorDashboardOut>(`/overview/operator?time_range=${timeRange}`, { signal }),
    staleTime: STALE_MS,
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVAL_MS,
    retry: shouldRetryQuery,
  });
}

/** Canonical strip for top bar and dashboard. Uses 5m so layout and dashboard share one query. */
export function useOperatorStrip() {
  const query = useOperatorOverview("5m");
  const strip: StripView | null = selectHealthStrip(query.data ?? null);
  const incidents = selectIncidents(query.data ?? null);
  return {
    strip,
    incidents,
    lastUpdated: strip?.lastUpdated ?? null,
    freshness: strip?.freshness ?? "unknown",
    error: query.error,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    data: query.data,
  };
}
