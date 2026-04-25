/** Query params for user list. */
export interface UserListParams {
  limit: number;
  offset: number;
  tgId?: string;
  email?: string;
  phone?: string;
  isBanned?: "all" | "true" | "false";
  planId?: string;
  region?: string;
}

/** Build /users path with query params shared by Users and Customer 360. */
export function buildUsersPath(params: UserListParams): string {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit));
  qs.set("offset", String(params.offset));
  if (params.tgId?.trim()) qs.set("tg_id", params.tgId.trim());
  if (params.email?.trim()) qs.set("email", params.email.trim());
  if (params.phone?.trim()) qs.set("phone", params.phone.trim());
  if (params.isBanned && params.isBanned !== "all") qs.set("is_banned", params.isBanned);
  if (params.planId?.trim()) qs.set("plan_id", params.planId.trim());
  if (params.region?.trim()) qs.set("region", params.region.trim());
  return `/users?${qs.toString()}`;
}

/** GET /users/:id/devices response. */
export interface UserDeviceListOut {
  items: Array<{
    id: string;
    subscription_id: string;
    server_id: string;
    delivery_mode: "awg_native" | "wireguard_universal" | "legacy_wg_via_relay" | null;
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
