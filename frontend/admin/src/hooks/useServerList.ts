import { useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ServerList, ServersSnapshotSummaryOut } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { serversLogger } from "../utils/serversLogger";
import { cooldownRemainingMs, isNetworkUnreachableError, shouldRetryQuery } from "../utils/queryPolicy";

export interface ServersTelemetrySummaryOut {
  servers: Record<
    string,
    { cpu_pct?: number; ram_pct?: number; peers?: number; health_score?: number; last_metrics_at?: string }
  >;
}

export type { ServersSnapshotSummaryOut };
import { api } from "../api/client";
import {
  SERVERS_LIST_FULL_KEY,
  SERVERS_LIST_KEY,
  SERVERS_SNAPSHOTS_SUMMARY_KEY,
} from "../api/query-keys";

export interface ServerListFilters {
  region?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  /** Only servers with last_seen_at within this many hours (hides stale). */
  lastSeenWithinHours?: number;
}

function buildServersQueryString(
  limit: number,
  offset: number,
  filters?: ServerListFilters
): string {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (filters?.region && filters.region !== "all") {
    params.set("region", filters.region);
  }
  if (filters?.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  const searchValue = typeof filters?.search === "string" ? filters.search.trim() : "";
  if (searchValue) params.set("search", searchValue);
  if (filters?.sort) {
    params.set("sort", filters.sort);
  }
  if (filters?.page != null && filters.page >= 1) {
    params.set("page", String(filters.page));
  }
  if (filters?.pageSize != null) {
    params.set("page_size", String(filters.pageSize));
  }
  if (filters?.lastSeenWithinHours != null && filters.lastSeenWithinHours >= 1) {
    params.set("last_seen_within_hours", String(filters.lastSeenWithinHours));
  }
  return `?${params.toString()}`;
}

/** Refetch interval only when tab is visible. */
const refetchWhenVisible = (ms: number) => () => (typeof document !== "undefined" && document.hidden ? false : ms);

export function useServerListFull() {
  return useQuery<ServerList>({
    queryKey: SERVERS_LIST_FULL_KEY,
    queryFn: ({ signal }) =>
      api.get<ServerList>(`/servers${buildServersQueryString(200, 0)}`, { signal }),
    staleTime: 60_000,
    refetchInterval: refetchWhenVisible(60_000),
  });
}

/** Full list (200) for a region filter. Use for Telemetry/Users/Devices when region scoping. Shares cache with useServerListFull when regionFilter === "all". */
export function useServerListForRegion(regionFilter: string, options?: { enabled?: boolean; refetchInterval?: number }) {
  const queryKey =
    regionFilter === "all"
      ? SERVERS_LIST_FULL_KEY
      : [...SERVERS_LIST_KEY, "region", regionFilter, 0];
  return useQuery<ServerList>({
    queryKey,
    queryFn: ({ signal }) =>
      api.get<ServerList>(
        `/servers${buildServersQueryString(200, 0, { region: regionFilter === "all" ? undefined : regionFilter })}`,
        { signal }
      ),
    staleTime: 60_000,
    ...options,
  });
}

/** Server list for Servers page. Uses backend filters. When region=all, offset=0, no search/status, shares cache with useServerListFull. */
export function useServerList(
  filters: {
    region?: string;
    status?: string;
    search?: string;
    sort?: string;
    offset?: number;
    limit?: number;
    page?: number;
    pageSize?: number;
    lastSeenWithinHours?: number;
  }
) {
  const networkCooldownUntilRef = useRef<number | null>(null);
  const {
    region = "all",
    status = "all",
    search = "",
    sort = "created_at_desc",
    offset = 0,
    limit = 20,
    page,
    pageSize = limit,
    lastSeenWithinHours,
  } = filters;

  // Defensive: callers should pass string, but runtime could be polluted/mis-called.
  const safeSearch = typeof search === "string" ? search : "";

  const usePagination = region === "all";
  const effectiveLimit = usePagination ? limit : 200;
  const effectiveOffset = usePagination ? offset : 0;
  const hasFilters = (status !== "all" && status) || safeSearch.trim();

  const filterObj: ServerListFilters = {
    region: region === "all" ? undefined : region,
    status: status === "all" ? undefined : status,
    search: safeSearch.trim() || undefined,
    sort,
    ...(usePagination && page != null && page >= 1
      ? { page, pageSize }
      : {}),
    ...(lastSeenWithinHours != null && lastSeenWithinHours >= 1
      ? { lastSeenWithinHours }
      : {}),
  };

  const queryKey = [
    ...SERVERS_LIST_KEY,
    "list",
    region,
    status,
    safeSearch.trim(),
    sort,
    page ?? offset,
    effectiveLimit,
    lastSeenWithinHours ?? "none",
  ] as const;

  const canShareFullCache =
    region === "all" && !hasFilters && effectiveOffset === 0 && (page == null || page <= 1) && lastSeenWithinHours == null;

  const endpoint = `/servers${buildServersQueryString(
    canShareFullCache ? 200 : effectiveLimit,
    canShareFullCache ? 0 : effectiveOffset,
    canShareFullCache ? {} : filterObj
  )}`;
  const query = useQuery<ServerList>({
    queryKey: canShareFullCache ? SERVERS_LIST_FULL_KEY : queryKey,
    queryFn: async ({ signal }) => {
      const start = Date.now();
      try {
        const data = await api.get<ServerList>(endpoint, { signal });
        serversLogger.serversListFetch({
          endpoint: `GET ${endpoint}`,
          status: 200,
          durationMs: Date.now() - start,
        });
        return data;
      } catch (e) {
        const err = e as ApiError;
        if (isNetworkUnreachableError(err)) {
          networkCooldownUntilRef.current = Date.now() + 60_000;
        }
        serversLogger.serversListFetch({
          endpoint: `GET ${endpoint}`,
          status: err?.statusCode ?? 0,
          durationMs: Date.now() - start,
          requestId: err?.requestId,
          error: err?.message ?? String(e),
        });
        throw e;
      }
    },
    staleTime: 15_000,
    refetchInterval: () => {
      const remaining = cooldownRemainingMs(networkCooldownUntilRef.current);
      if (remaining > 0) return remaining;
      return refetchWhenVisible(15_000)();
    },
    refetchOnWindowFocus: true,
    retry: shouldRetryQuery,
  });

  const clearNetworkCooldown = useCallback(() => {
    networkCooldownUntilRef.current = null;
  }, []);

  const networkCooldownRemainingMs = cooldownRemainingMs(networkCooldownUntilRef.current);
  return {
    ...query,
    networkCooldownRemainingMs,
    isNetworkCooldown: networkCooldownRemainingMs > 0,
    clearNetworkCooldown,
  };
}

export function useServersTelemetrySummary(filters?: { region?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.region && filters.region !== "all") params.set("region", filters.region);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  const qs = params.toString();
  return useQuery<ServersTelemetrySummaryOut>({
    queryKey: [...SERVERS_LIST_KEY, "telemetry-summary", filters?.region ?? "all", filters?.status ?? "all", filters?.search ?? ""],
    queryFn: ({ signal }) =>
      api.get<ServersTelemetrySummaryOut>(`/servers/telemetry/summary${qs ? `?${qs}` : ""}`, { signal }),
    staleTime: 15_000,
  });
}

/** Per-server telemetry from last snapshot (authoritative). Prefer over telemetry/summary for CPU/RAM/Users/IPs. */
export function useServersSnapshotSummary() {
  return useQuery<ServersSnapshotSummaryOut>({
    queryKey: SERVERS_SNAPSHOTS_SUMMARY_KEY,
    queryFn: ({ signal }) => api.get<ServersSnapshotSummaryOut>("/servers/snapshots/summary", { signal }),
    staleTime: 30_000,
  });
}
