import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { userKeys } from "@/features/users/services/user.query-keys";
import { useApiMutation } from "./useApiMutation";
import type { UserDetail, UserList } from "@/shared/types/admin-api";

/** Query params for user list. */
export interface UserListParams {
  limit: number;
  offset: number;
  tgId?: string;
  email?: string;
  phone?: string;
  isBanned?: "all" | "true" | "false";
}

/**
 * Purpose: Build /users path with query params.
 * Used in: useGetUserList.
 */
export function buildUsersPath(params: UserListParams): string {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit));
  qs.set("offset", String(params.offset));
  if (params.tgId?.trim()) qs.set("tg_id", params.tgId.trim());
  if (params.email?.trim()) qs.set("email", params.email.trim());
  if (params.phone?.trim()) qs.set("phone", params.phone.trim());
  if (params.isBanned && params.isBanned !== "all") qs.set("is_banned", params.isBanned);
  return `/users?${qs.toString()}`;
}

/**
 * Purpose: Fetch user list with filters.
 * Used in: UsersPage table.
 */
export function useGetUserList(params: UserListParams) {
  const path = buildUsersPath(params);
  return useApiQuery<UserList>([...userKeys.list(path)], path, { retry: 1, staleTime: 15_000 });
}

/**
 * Purpose: Fetch single user by id.
 * Used in: UsersPage detail panel.
 */
export function useGetUser(userId: number | null) {
  const resolvedId = userId ?? 0;
  return useApiQuery<UserDetail>(
    [...userKeys.detail(resolvedId)],
    `/users/${userId!}`,
    { enabled: !!userId, retry: 0 }
  );
}

/** GET /users/:id/devices response. */
export interface UserDeviceListOut {
  items: Array<{
    id: string;
    subscription_id: string;
    server_id: string;
    device_name: string | null;
    public_key: string;
    allowed_ips: string | null;
    issued_at: string;
    revoked_at: string | null;
    suspended_at: string | null;
    data_limit_bytes: number | null;
    expires_at: string | null;
    created_at: string;
    apply_status: string | null;
    last_error: string | null;
    protocol_version: string | null;
  }>;
  total: number;
}

/**
 * Purpose: Fetch devices for a user.
 * Used in: UsersPage user detail devices list.
 */
export function useGetUserDevices(userId: number | null) {
  const resolvedId = userId ?? 0;
  return useApiQuery<UserDeviceListOut>(
    [...userKeys.devices(resolvedId)],
    `/users/${userId!}/devices?limit=50&offset=0`,
    { enabled: !!userId, retry: 0, staleTime: 10_000 }
  );
}

/**
 * Purpose: Invalidate user-related queries.
 * Used in: UsersPage after update/delete/issue.
 */
export function useUsersInvalidate() {
  const queryClient = useQueryClient();
  return function invalidateUsers(selectedUserId?: number | null) {
    void queryClient.invalidateQueries({ queryKey: [...userKeys.lists()] });
    if (selectedUserId != null) {
      void queryClient.invalidateQueries({ queryKey: [...userKeys.detail(selectedUserId)] });
      void queryClient.invalidateQueries({ queryKey: [...userKeys.devices(selectedUserId)] });
    }
  };
}

/**
 * Purpose: PATCH /users/:id; invalidates users.
 * Used in: UsersPage edit/ban.
 */
export function useUpdateUser() {
  const invalidateUsers = useUsersInvalidate();
  return useApiMutation({
    mutationFn: (api) => (payload: { userId: number; body: Record<string, unknown> }) =>
      api.patch(`/users/${payload.userId}`, payload.body),
    onSuccess: () => {
      invalidateUsers();
    },
  });
}

/**
 * Purpose: DELETE /users/:id; invalidates users. Requires confirm_token in body.
 * Used in: UsersPage delete modal.
 */
export function useDeleteUser() {
  const invalidateUsers = useUsersInvalidate();
  return useApiMutation({
    mutationFn: (api) => (payload: { userId: number; confirm_token: string }) =>
      api.request(`/users/${payload.userId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm_token: payload.confirm_token }),
      }),
    onSuccess: () => {
      invalidateUsers();
    },
  });
}
