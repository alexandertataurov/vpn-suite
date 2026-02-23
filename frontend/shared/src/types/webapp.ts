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
}

export interface WebAppMeResponse {
  user: WebAppMeUser | null;
  subscriptions: WebAppMeSubscription[];
  devices: WebAppMeDevice[];
}

export interface WebAppReferralMyLinkResponse {
  referral_code: string;
  payload: string;
}

export interface WebAppReferralStatsResponse {
  total_referrals: number;
  rewards_applied: number;
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
}
