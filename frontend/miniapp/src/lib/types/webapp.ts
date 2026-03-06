/** Webapp API types (hand-written; not in OpenAPI export). */

export interface WebAppAuthResponse {
  session_token: string;
  expires_in: number;
}

export interface WebAppMeUser {
  id: number;
  tg_id: number;
}

export interface WebAppMeSubscription {
  id: string;
  plan_id: string;
  status: string;
  valid_until: string;
  device_limit: number;
}

export interface WebAppMeDevice {
  id: string;
  device_name: string | null;
  issued_at: string;
  revoked_at: string | null;
  last_seen_handshake_at?: string | null;
  apply_status?: string | null;
}

export interface WebAppMeResponse {
  user: WebAppMeUser | null;
  subscriptions: WebAppMeSubscription[];
  devices: WebAppMeDevice[];
  onboarding: WebAppOnboardingState;
}

export interface WebAppOnboardingState {
  completed: boolean;
  step: number | null;
  version: number;
  updated_at: string | null;
}

export interface WebAppOnboardingStateRequest {
  step: number;
  completed?: boolean;
  version: number;
}

export interface WebAppOnboardingStateResponse {
  onboarding: WebAppOnboardingState;
}

export interface WebAppReferralMyLinkResponse {
  referral_code: string;
  payload: string;
}

export interface WebAppReferralStatsResponse {
  total_referrals: number;
  rewards_applied: number;
  earned_days: number;
  active_referrals: number;
  pending_rewards: number;
  invite_goal: number;
  invite_progress: number;
  invite_remaining: number;
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

export type WebAppBillingHistoryStatus = "paid" | "pending" | "refunded" | "failed";

export interface WebAppBillingHistoryItem {
  payment_id: string;
  plan_id: string | null;
  plan_name: string;
  amount: number;
  currency: string;
  status: WebAppBillingHistoryStatus;
  created_at: string;
  invoice_ref: string;
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
  config_awg: string | null;
  config_wg_obf: string | null;
  config_wg: string | null;
  issued_at: string;
  node_mode: "mock" | "real";
  peer_created: boolean;
}
