import { useMutation, type UseMutationOptions, type UseMutationResult } from "@tanstack/react-query";
import { useApi } from "@/core/api/context";

/**
 * Thin wrapper around useMutation that uses the project's API client.
 * Purpose: POST/PATCH/PUT/DELETE with optional query invalidation on success.
 * Used in: useCreateServer, useUpdateServer, useDeleteServer, useUpdateUser, useDeleteUser, device action hooks.
 */
export function useApiMutation<TData = unknown, TError = Error, TVariables = void>(
  options: {
    mutationFn: (api: ReturnType<typeof useApi>) => (variables: TVariables) => Promise<TData>;
    onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
  } & Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">
): UseMutationResult<TData, TError, TVariables> {
  const api = useApi();
  const { mutationFn, onSuccess, ...rest } = options;
  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables) => mutationFn(api)(variables),
    onSuccess: (data, variables, context) => {
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}
