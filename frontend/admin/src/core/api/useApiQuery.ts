import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useApi } from "./context";

const DEFAULT_STALE_TIME = 30_000;
const DEFAULT_RETRY = 2;

export function useApiQuery<TData>(
  key: unknown[],
  path: string,
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">
): UseQueryResult<TData> {
  const api = useApi();
  return useQuery<TData>({
    queryKey: key,
    queryFn: ({ signal }) => api.get<TData>(path, { signal }),
    staleTime: options?.staleTime ?? DEFAULT_STALE_TIME,
    retry: options?.retry ?? DEFAULT_RETRY,
    ...options,
  });
}
