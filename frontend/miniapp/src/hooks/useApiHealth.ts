import { useQuery } from "@tanstack/react-query";
import { webappApi } from "../api/client";

interface HealthReadyResponse {
  status?: string;
  database?: string;
  redis?: string;
}

export function useApiHealth() {
  return useQuery<HealthReadyResponse>({
    queryKey: ["webapp", "health", "ready"],
    queryFn: () => webappApi.get<HealthReadyResponse>("/health/ready"),
    staleTime: 60_000,
    retry: 1,
  });
}

