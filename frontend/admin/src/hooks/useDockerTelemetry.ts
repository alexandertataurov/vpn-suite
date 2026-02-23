import { useQuery } from "@tanstack/react-query";
import type {
  AlertItemListOut,
  ContainerLogLineListOut,
  ContainerMetricsTimeseries,
  ContainerSummaryListOut,
  HostSummaryListOut,
} from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { DOCKER_TELEMETRY_KEY } from "../api/query-keys";

const OVERVIEW_INTERVAL_MS = 8000;
const DETAIL_INTERVAL_MS = 3000;
const BACKOFF_MAX_MS = 60_000;

function refetchWhenVisible(intervalMs: number) {
  return () => (typeof document !== "undefined" && document.hidden ? false : intervalMs);
}

/** Backoff interval: base * 2^min(failures, 4), capped at BACKOFF_MAX_MS. */
function backoffInterval(baseMs: number, failureCount: number): number {
  if (failureCount <= 0) return baseMs;
  const multiplier = Math.min(Math.pow(2, Math.min(failureCount, 4)), BACKOFF_MAX_MS / baseMs);
  return Math.min(baseMs * multiplier, BACKOFF_MAX_MS);
}

export function useDockerHosts(refetchIntervalMs = OVERVIEW_INTERVAL_MS) {
  return useQuery<HostSummaryListOut>({
    queryKey: [...DOCKER_TELEMETRY_KEY, "hosts"],
    queryFn: ({ signal }) => api.get<HostSummaryListOut>("/telemetry/docker/hosts", { signal }),
    refetchInterval: (query) => {
      const items = query.state.data?.items;
      if (items?.length === 0) return false; // Stop polling when no hosts configured
      const interval = backoffInterval(refetchIntervalMs, (query.state as { failureCount?: number }).failureCount ?? 0);
      return refetchWhenVisible(interval)();
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

export function useDockerContainers(hostId: string, refetchIntervalMs = OVERVIEW_INTERVAL_MS) {
  return useQuery<ContainerSummaryListOut>({
    queryKey: [...DOCKER_TELEMETRY_KEY, "containers", hostId],
    queryFn: ({ signal }) =>
      api.get<ContainerSummaryListOut>(`/telemetry/docker/containers?host_id=${encodeURIComponent(hostId)}`, { signal }),
    enabled: Boolean(hostId),
    refetchInterval: (query) => {
      const interval = backoffInterval(refetchIntervalMs, (query.state as { failureCount?: number }).failureCount ?? 0);
      return refetchWhenVisible(interval)();
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

export function useContainerMetrics(
  hostId: string,
  containerId: string,
  range = "1h",
  step = "15s",
  refetchIntervalMs = DETAIL_INTERVAL_MS
) {
  return useQuery<ContainerMetricsTimeseries>({
    queryKey: [...DOCKER_TELEMETRY_KEY, "metrics", hostId, containerId, range, step],
    queryFn: ({ signal }) =>
      api.get<ContainerMetricsTimeseries>(
        `/telemetry/docker/container/${encodeURIComponent(containerId)}/metrics?host_id=${encodeURIComponent(hostId)}&range=${encodeURIComponent(range)}&step=${encodeURIComponent(step)}`,
        { signal }
      ),
    enabled: Boolean(hostId && containerId),
    refetchInterval: (query) => {
      const interval = backoffInterval(refetchIntervalMs, (query.state as { failureCount?: number }).failureCount ?? 0);
      return refetchWhenVisible(interval)();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
  });
}

export function useContainerLogs(
  hostId: string,
  containerId: string,
  tail = 200,
  since: string | null = null,
  pollingEnabled = true,
  refetchIntervalMs = DETAIL_INTERVAL_MS
) {
  return useQuery<ContainerLogLineListOut>({
    queryKey: [...DOCKER_TELEMETRY_KEY, "logs", hostId, containerId, tail, since],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        host_id: hostId,
        tail: String(tail),
      });
      if (since) params.set("since", since);
      return api.get<ContainerLogLineListOut>(
        `/telemetry/docker/container/${encodeURIComponent(containerId)}/logs?${params.toString()}`,
        { signal }
      );
    },
    enabled: Boolean(hostId && containerId) && pollingEnabled,
    refetchInterval: (query) => {
      const interval = backoffInterval(refetchIntervalMs, (query.state as { failureCount?: number }).failureCount ?? 0);
      return refetchWhenVisible(interval)();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    retry: false,
  });
}

export function useDockerAlerts(hostId: string, refetchIntervalMs = OVERVIEW_INTERVAL_MS) {
  return useQuery<AlertItemListOut>({
    queryKey: [...DOCKER_TELEMETRY_KEY, "alerts", hostId],
    queryFn: ({ signal }) =>
      api.get<AlertItemListOut>(`/telemetry/docker/alerts?host_id=${encodeURIComponent(hostId)}`, { signal }),
    enabled: Boolean(hostId),
    refetchInterval: (query) => {
      const interval = backoffInterval(refetchIntervalMs, (query.state as { failureCount?: number }).failureCount ?? 0);
      return refetchWhenVisible(interval)();
    },
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}
