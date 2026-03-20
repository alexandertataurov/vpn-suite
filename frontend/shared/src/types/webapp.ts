/** Webapp API types (hand-written; not in OpenAPI export). */

// Why: these shapes are consumed by both admin + miniapp, but currently drift slightly.
// We keep a compatible superset and use optional fields where one side lacks data.

export interface WebAppAuthResponse {
  session_token: string;
  expires_in: number;
}

export interface WebAppMeUser {
  id: number;
  tg_id: number;
  email?: string | null;
  phone?: string | null;
  /** Display name (user override or from Telegram). */
  display_name?: string | null;
  /** Telegram profile photo URL from meta.tg. */
  photo_url?: string | null;
  /** User locale preference (e.g. en, ru, uk). */
  locale?: string | null;
  onboarding_step?: number | null;
  first_connected_at?: string | null;
  last_connection_confirmed_at?: string | null;
}

/** Request body for PATCH /webapp/me. Only provided fields are updated. */
export interface WebAppMeProfileUpdate {
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
  locale?: string | null;
}

export interface WebAppMeProfileUpdateResponse {
  user: WebAppMeUser;
}

export interface WebAppLogoutResponse {
  status: "ok";
}

export interface WebAppMeSubscription {
  id: string;
  plan_id: string;
  status: string;
  subscription_status?: string;
  access_status?: string;
  billing_status?: string;
  renewal_status?: string;
  valid_until: string;
  grace_until?: string | null;
  cancel_at_period_end?: boolean;
  accrued_bonus_days?: number;
  device_limit: number;
  auto_renew?: boolean;
  is_trial?: boolean;
  trial_ends_at?: string | null;
}

export interface WebAppMeDevice {
  id: string;
  device_name: string | null;
  platform?: string | null;
  server_id?: string;
  issued_at: string;
  revoked_at: string | null;
  last_seen_handshake_at?: string | null;
  last_connection_confirmed_at?: string | null;
  apply_status?: string | null;
  status?: "connected" | "idle" | "revoked" | "config_pending";
}

export interface WebAppMeRouting {
  recommended_route: string;
  reason: string;
}

export interface WebAppLatestDeviceDelivery {
  device_id: string;
  device_name?: string | null;
  issued_at: string;
  download_url?: string | null;
  amnezia_vpn_key?: string | null;
}

export interface WebAppLiveConnection {
  status: "connected" | "disconnected" | "unknown";
  source: "server_handshake";
  device_id: string | null;
  device_name?: string | null;
  last_handshake_at?: string | null;
  handshake_age_sec?: number | null;
  telemetry_updated_at?: string | null;
}

export interface WebAppOnboardingState {
  completed: boolean;
  step: number | null;
  version: number;
  updated_at: string | null;
}

export interface WebAppMeResponse {
  user: WebAppMeUser | null;
  subscriptions: WebAppMeSubscription[];
  devices: WebAppMeDevice[];
  public_ip?: string | null;
  latest_device_delivery?: WebAppLatestDeviceDelivery | null;
  live_connection?: WebAppLiveConnection | null;
  onboarding: WebAppOnboardingState;
  routing?: WebAppMeRouting;
}

export interface WebAppOnboardingStateRequest {
  step: number;
  completed?: boolean;
  version: number;
}

export interface WebAppOnboardingStateResponse {
  onboarding: WebAppOnboardingState;
}

/** Flat access state for state-driven Home UI. GET /webapp/user/access */
export type UserAccessStatus =
  | "no_plan"
  | "needs_device"
  | "generating_config"
  | "ready"
  | "expired"
  | "device_limit"
  | "error"
  | "loading";

export interface UserAccessResponse {
  status: UserAccessStatus;
  has_plan: boolean;
  plan_id?: string | null;
  plan_name?: string | null;
  plan_duration_days?: number | null;
  devices_used: number;
  device_limit: number | null;
  traffic_used_bytes?: number | null;
  config_ready: boolean;
  config_id: string | null;
  expires_at: string | null;
  amnezia_vpn_key: string | null;
}

export interface WebAppReferralMyLinkResponse {
  referral_code: string;
  payload: string;
  /** Bot @username (no @) for referral link; from backend when set. */
  bot_username?: string | null;
}

export interface WebAppReferralStatsResponse {
  total_referrals: number;
  rewards_applied: number;
  earned_days: number;
  active_referrals: number;
  pending_rewards: number;
  pending_reward_days?: number;
  invite_goal: number;
  invite_progress: number;
  invite_remaining: number;
}

/** GET /webapp/support/faq — keys match miniapp i18n catalog. */
export interface WebAppSupportFaqItem {
  title_key: string;
  body_key: string;
}

export interface WebAppSupportFaqResponse {
  items: WebAppSupportFaqItem[];
}

export interface WebAppPromoValidateResponse {
  valid: boolean;
  type: string;
  value: string;
  description: string;
}

export interface WebAppCreateInvoiceResponse {
  invoice_id: string;
  payment_id: string;
  title: string;
  description: string;
  currency: string;
  star_count: number;
  payload: string;
  server_id: string;
  subscription_id: string;
  /** Telegram invoice URL from createInvoiceLink; open with WebApp.openInvoice(). */
  invoice_link?: string;
  invoice_url?: string;
  /** True when plan is free (e.g. operator); subscription activated without payment. */
  free_activation?: boolean;
}

export interface WebAppPaymentStatusOut {
  payment_id: string;
  status: string;
  plan_id: string | null;
  valid_until: string | null;
}

export type WebAppBillingHistoryStatus = "paid" | "pending" | "failed" | "refunded";

export interface WebAppBillingHistoryItem {
  payment_id: string;
  status: WebAppBillingHistoryStatus;

  // Why: miniapp UI expects these to always render; admin may treat missing as a backend bug.
  amount: number;
  currency: string;
  created_at: string;
  plan_name: string;
  invoice_ref: string;

  // admin-only fields today
  duration_days?: number;

  // other surface includes this
  plan_id?: string | null;
}

export interface WebAppBillingHistoryResponse {
  items: WebAppBillingHistoryItem[];
  total: number;
}

export interface WebAppServerItem {
  id: string;
  name: string;
  region: string;
  load_percent: number | null;
  avg_ping_ms: number | null;
  is_recommended: boolean;
  is_current: boolean;
}

export interface WebAppServersResponse {
  items: WebAppServerItem[];
  total: number;
  auto_select: boolean;
}

export interface WebAppSubscriptionOffersResponse {
  subscription_id: string | null;
  status: string | null;
  valid_until: string | null;
  discount_percent: number;
  can_pause: boolean;
  can_resume: boolean;
  /** Reason-driven offers (backend returns when ?reason_group= is set). */
  offer_pause?: boolean;
  offer_discount?: boolean;
  offer_downgrade?: boolean;
  reason_group?: string | null;
}

export interface WebAppUsagePoint {
  ts: string;
  bytes_in: number;
  bytes_out: number;
}

export interface WebAppUsageResponse {
  points: WebAppUsagePoint[];
  sessions: number;
  peak_hours?: number[] | null;
}

export interface WebAppIssueDeviceResponse {
  device_id: string;
  config: string | null;
  config_awg?: string | null;
  config_wg_obf?: string | null;
  config_wg?: string | null;
  amnezia_vpn_key?: string | null;
  issued_at: string;

  // Why: backend has used both string and a narrow union across endpoints.
  node_mode: "mock" | "real" | (string & {});
  peer_created: boolean;
}
