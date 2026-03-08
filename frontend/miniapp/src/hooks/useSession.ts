import { useQuery } from "@tanstack/react-query";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import { webappApi } from "../api/client";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export function useSession(enabled: boolean) {
  return useQuery<WebAppMeResponse>({
    queryKey: [...webappQueryKeys.me()],
    queryFn: () => webappApi.get<WebAppMeResponse>("/webapp/me"),
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
