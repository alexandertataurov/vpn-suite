import { useQuery } from "@tanstack/react-query";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import { getMe } from "../api";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export function useSession(enabled: boolean) {
  return useQuery<WebAppMeResponse>({
    queryKey: [...webappQueryKeys.me()],
    queryFn: getMe,
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
