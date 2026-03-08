export interface DeviceListParams {
  limit: number;
  offset: number;
  status?: string | null;
  node_id?: string | null;
}

export const deviceKeys = {
  all: ["devices"] as const,
  lists: () => [...deviceKeys.all, "list"] as const,
  list: (params: DeviceListParams) =>
    [...deviceKeys.lists(), params.limit, params.offset, params.status ?? "", params.node_id ?? ""] as const,
  detail: (deviceId: string) => [...deviceKeys.all, "detail", deviceId] as const,
  summary: () => [...deviceKeys.all, "summary"] as const,
  configHealth: () => [...deviceKeys.all, "config-health"] as const,
};

