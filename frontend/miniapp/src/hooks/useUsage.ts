import { useQuery } from "@tanstack/react-query";
import type { WebAppUsageResponse } from "@vpn-suite/shared/types";
import { webappApi } from "../api/client";

export function useUsage(enabled: boolean, range: "7d" | "30d" = "7d") {
  return useQuery<WebAppUsageResponse>({
    queryKey: ["webapp", "usage", range],
    queryFn: () => webappApi.get<WebAppUsageResponse>(`/webapp/usage?range=${range}`),
    enabled,
    staleTime: 60 * 1000,
  });
}

