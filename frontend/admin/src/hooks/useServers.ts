import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "./useApiMutation";
import type {
  ServerOut,
  ServerList,
  ServersSnapshotSummaryOut,
} from "@/shared/types/admin-api";

/**
 * Purpose: Fetch single server by id.
 * Used in: ServersPage detail / edit modal.
 */
export function useGetServer(serverId: string | null) {
  return useApiQuery<ServerOut>(
    ["servers", "detail", serverId!],
    `/servers/${serverId!}`,
    { enabled: !!serverId, retry: 0 }
  );
}

/**
 * Purpose: Fetch server list (settings list).
 * Used in: ServersPage settings table.
 */
export function useGetServerList(params: { limit: number; offset: number }) {
  const path = `/servers?limit=${params.limit}&offset=${params.offset}`;
  return useApiQuery<ServerList>(["servers", "settings", "list", path], path, { retry: 1 });
}

/**
 * Purpose: Fetch snapshot summary (telemetry per server).
 * Used in: ServersPage main snapshot table.
 */
export function useGetServersSnapshotSummary() {
  return useApiQuery<ServersSnapshotSummaryOut>(
    ["servers", "snapshots", "summary"],
    "/servers/snapshots/summary",
    { retry: 1 }
  );
}

/**
 * Purpose: POST /servers; invalidates server queries.
 * Used in: ServersPage add server.
 */
export function useCreateServer() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (api) => (body: Record<string, unknown>) => api.post<ServerOut>("/servers", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

/**
 * Purpose: PATCH /servers/:id; invalidates server queries.
 * Used in: ServersPage edit modal.
 */
export function useUpdateServer() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (api) => (payload: { serverId: string; body: Record<string, unknown> }) =>
      api.patch<ServerOut>(`/servers/${payload.serverId}`, payload.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

/**
 * Purpose: DELETE /servers/:id; invalidates server queries.
 * Used in: ServersPage delete flow.
 */
export function useDeleteServer() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (api) => (serverId: string) =>
      api.request(`/servers/${serverId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}
