import { useQuery } from "@tanstack/react-query";
import type { TelemetrySnapshotOut } from "@vpn-suite/shared/types";
import { api } from "../../../api/client";
import { TELEMETRY_SNAPSHOT_KEY } from "../../../api/query-keys";
import { shouldRetryQuery } from "../../../utils/queryPolicy";

const STALE_MS = 8_000;
const REFETCH_INTERVAL_MS = 15_000;

export function useTelemetrySnapshotMeta() {
  return useQuery<TelemetrySnapshotOut>({
    queryKey: [...TELEMETRY_SNAPSHOT_KEY, "meta", "nodes.summary"],
    queryFn: ({ signal }) =>
      api.get<TelemetrySnapshotOut>(
        "/telemetry/snapshot?scope=all&fields=meta,nodes.summary",
        { signal }
      ),
    staleTime: STALE_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: shouldRetryQuery,
  });
}

