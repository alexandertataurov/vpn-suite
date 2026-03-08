import { useQuery } from "@tanstack/react-query";
import { webappApi } from "../api/client";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

interface HealthReadyResponse {
  status?: string;
  database?: string;
  redis?: string;
}

export function useApiHealth(enabled = true) {
  return useQuery<HealthReadyResponse>({
    queryKey: [...webappQueryKeys.healthReady()],
    queryFn: () => webappApi.get<HealthReadyResponse>("/health/ready"),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
