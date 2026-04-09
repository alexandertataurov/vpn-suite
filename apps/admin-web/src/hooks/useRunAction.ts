import { useCallback, useState } from "react";

/**
 * Purpose: Generic "run async action" with isPending/error; optional onSuccess invalidate.
 * Used in: DevicesPage, UsersPage, ServersPage for mutate-then-invalidate flows.
 */
export function useRunAction(options?: {
  onSuccess?: () => void;
}): {
  run: (fn: () => Promise<unknown>) => Promise<void>;
  isPending: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const onSuccess = options?.onSuccess;
  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null);
      setPending(true);
      try {
        await fn();
        onSuccess?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setPending(false);
      }
    },
    [onSuccess]
  );

  return { run, isPending, error, clearError };
}
