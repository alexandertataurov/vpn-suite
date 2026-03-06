import { useApiQuery } from "@/core/api/useApiQuery";
import type { VpnNodeDetail } from "./types";

export function useVpnNodeDetail(serverId: string | null) {
  return useApiQuery<VpnNodeDetail>(
    ["servers", "vpn-node", serverId ?? ""],
    serverId ? `/servers/${serverId}/vpn-node` : "",
    { enabled: !!serverId, retry: 1, staleTime: 15_000 }
  );
}
