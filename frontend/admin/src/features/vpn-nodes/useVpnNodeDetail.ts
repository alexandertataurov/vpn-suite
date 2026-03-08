import { useApiQuery } from "@/hooks/api/useApiQuery";
import { vpnNodeKeys } from "./services/vpn-node.query-keys";
import type { VpnNodeDetail } from "./types";

export function useVpnNodeDetail(serverId: string | null) {
  const resolvedId = serverId ?? "";
  return useApiQuery<VpnNodeDetail>(
    [...vpnNodeKeys.detail(resolvedId)],
    serverId ? `/servers/${serverId}/vpn-node` : "",
    { enabled: !!serverId, retry: 1, staleTime: 15_000 }
  );
}
