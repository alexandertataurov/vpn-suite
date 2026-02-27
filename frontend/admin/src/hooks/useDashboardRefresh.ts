/**
 * Canonical "Refresh" for dashboard scope. Refetches operator, peers, connection nodes, audit, servers list + registry.
 * Use for dashboard Refresh button; Resync remains a separate destructive action with confirm.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AUDIT_KEY,
  CONNECTION_NODES_KEY,
  OPERATOR_DASHBOARD_KEY,
  PEERS_LIST_KEY,
  SERVERS_LIST_DASHBOARD_KEY,
} from "../api/query-keys";
import { refreshRegisteredResources } from "../utils/resourceRegistry";
import { track } from "../telemetry";

const DASHBOARD_REFETCH_KEYS = [
  OPERATOR_DASHBOARD_KEY,
  PEERS_LIST_KEY,
  CONNECTION_NODES_KEY,
  AUDIT_KEY,
  SERVERS_LIST_DASHBOARD_KEY,
] as const;

export function useDashboardRefresh() {
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      track("user_action", { action_type: "dashboard_refresh", target_page: "/" });
    } catch {
      /* noop */
    }
    const [results, registered] = await Promise.all([
      Promise.all(
        DASHBOARD_REFETCH_KEYS.map((key) =>
          queryClient.refetchQueries({ queryKey: key })
        )
      ),
      refreshRegisteredResources(),
    ]);
    const hasResultError = results.some(
      (res) => Array.isArray(res) && res.some((r) => (r as { error?: unknown }).error)
    );
    const hasCacheError = DASHBOARD_REFETCH_KEYS.some((key) =>
      queryClient.getQueryCache().findAll({ queryKey: key }).some((q) => q.state.status === "error")
    );
    const hasRegisteredError = registered.some((r) => !r.ok);
    if (hasResultError || hasCacheError || hasRegisteredError) {
      throw new Error("refresh_failed");
    }
  }, [queryClient]);

  return { refresh };
}
