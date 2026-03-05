import { useQuery } from "@tanstack/react-query";
import type { WebAppMeResponse } from "@/lib/types";
import { webappApi } from "../api/client";

export function useSession(enabled: boolean) {
  return useQuery<WebAppMeResponse>({
    queryKey: ["webapp", "me"],
    queryFn: () => webappApi.get<WebAppMeResponse>("/webapp/me"),
    enabled,
    retry: false,
    staleTime: 60 * 1000,
  });
}
