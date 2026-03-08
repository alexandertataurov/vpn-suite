import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared";
import { webappApi } from "@/api/client";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";

export interface UseUpdateSubscriptionOptions {
  /** Current subscription id for optimistic cache update. */
  primarySubId?: string | null;
  onError?: (message: string) => void;
}

/** PATCH /api/v1/subscriptions/me — update auto_renew. Invalidates and optionally optimistically updates webapp/me cache. */
export function useUpdateSubscription(options: UseUpdateSubscriptionOptions = {}) {
  const { primarySubId, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (auto_renew: boolean) =>
      webappApi.patch<{ auto_renew: boolean }>("/subscriptions/me", { auto_renew }),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: [...webappQueryKeys.me()] });
      const previous = queryClient.getQueryData([...webappQueryKeys.me()]);
      if (previous && primarySubId) {
        queryClient.setQueryData([...webappQueryKeys.me()], (old: unknown) => {
          const data = old as { subscriptions?: Array<Record<string, unknown>> } | null;
          if (!data?.subscriptions) return old;
          return {
            ...data,
            subscriptions: data.subscriptions.map((sub) =>
              sub && sub.id === primarySubId ? { ...sub, auto_renew: next } : sub,
            ),
          };
        });
      }
      return { previous };
    },
    onError: (err, _next, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData([...webappQueryKeys.me()], ctx.previous);
      }
      const message =
        err instanceof ApiError ? err.message : "Could not update auto-renew. Please try again.";
      onError?.(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
}
