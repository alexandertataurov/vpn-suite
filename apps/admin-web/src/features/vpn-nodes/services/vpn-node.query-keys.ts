import { serverKeys } from "@/features/servers/services/server.query-keys";

export const vpnNodeKeys = {
  cards: () => serverKeys.vpnNodes(),
  detail: (serverId: string) => serverKeys.vpnNodeDetail(serverId),
};

