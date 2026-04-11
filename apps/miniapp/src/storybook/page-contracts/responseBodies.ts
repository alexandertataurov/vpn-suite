/** Storybook webapp API mock payloads — internal to page-contracts. */

export const activePlans = {
  items: [
    {
      id: "pro-monthly",
      name: "Pro Monthly",
      duration_days: 30,
      device_limit: 3,
      price_amount: 9,
      price_currency: "XTR",
      style: "normal",
      upsell_methods: ["expiry", "device_limit", "referral"],
      display_order: 1,
    },
    {
      id: "pro-annual",
      name: "Pro Annual",
      duration_days: 365,
      device_limit: 5,
      price_amount: 79,
      price_currency: "XTR",
      style: "popular",
      upsell_methods: ["expiry", "device_limit", "referral"],
      display_order: 2,
    },
    {
      id: "pro-lifetime",
      name: "Pro Lifetime",
      duration_days: 3650,
      device_limit: 10,
      price_amount: 199,
      price_currency: "XTR",
      style: "promotional",
      upsell_methods: ["device_limit", "referral"],
      display_order: 3,
    },
  ],
};

export const activeSession = {
  user: {
    id: 42,
    tg_id: 4242,
    display_name: "Alex Morgan",
    email: "alex@vpn.example",
    phone: "+1 555 0100",
    locale: "en",
    first_connected_at: "2025-11-03T10:00:00Z",
  },
  subscriptions: [
    {
      id: "sub-active",
      plan_id: "pro-monthly",
      status: "active",
      subscription_status: "active",
      access_status: "enabled",
      valid_until: "2026-03-24T12:00:00Z",
      trial_ends_at: "2026-03-24T12:00:00Z",
      is_trial: false,
      auto_renew: true,
      device_limit: 3,
    },
  ],
  devices: [
    {
      id: "dev-mac-active",
      device_name: "MacBook Pro",
      issued_at: "2026-02-10T08:12:00Z",
      last_seen_handshake_at: "2026-03-10T10:10:00Z",
      confirmed_connected_at: "2026-03-10T10:11:00Z",
      status: "connected",
      revoked_at: null,
    },
    {
      id: "dev-phone-ready",
      device_name: "iPhone 15 Pro",
      issued_at: "2026-03-06T09:42:00Z",
      last_seen_handshake_at: "2026-03-10T09:50:00Z",
      confirmed_connected_at: null,
      status: "config_pending",
      revoked_at: null,
    },
  ],
  public_ip: "185.199.110.42",
  latest_device_delivery: {
    device_id: "dev-mac-active",
    device_name: "MacBook Pro",
    issued_at: "2026-02-10T08:12:00Z",
    amnezia_vpn_key: "vpn://storybook-amnezia-key",
  },
  routing: {
    recommended_route: "/",
    reason: "connected_user",
  },
  onboarding: {
    completed: true,
    step: 3,
    version: 2,
    updated_at: "2026-03-01T00:00:00Z",
  },
};

export const trialEndingSession = {
  ...activeSession,
  subscriptions: [
    {
      ...activeSession.subscriptions[0],
      id: "sub-trial",
      is_trial: true,
      auto_renew: false,
      access_status: "enabled",
      valid_until: "2026-03-13T12:00:00Z",
      trial_ends_at: "2026-03-13T12:00:00Z",
      device_limit: 2,
    },
  ],
};

export const expiredHomeSession = {
  ...activeSession,
  subscriptions: [
    {
      ...activeSession.subscriptions[0],
      id: "sub-expired-home",
      plan_id: "pro-annual",
      status: "expired",
      subscription_status: "expired",
      access_status: "grace",
      auto_renew: false,
      valid_until: "2026-03-05T12:00:00Z",
      device_limit: 5,
    },
  ],
  routing: {
    recommended_route: "/restore-access",
    reason: "expired_with_grace",
  },
};

export const noPlanSession = {
  ...activeSession,
  subscriptions: [],
  devices: [],
  public_ip: null,
  routing: {
    recommended_route: "/plan",
    reason: "no_subscription",
  },
};

export const emptyDevicesSession = {
  ...activeSession,
  devices: [],
};

export const limitReachedSession = {
  ...activeSession,
  devices: [
    {
      id: "dev-1",
      device_name: "MacBook Pro",
      issued_at: "2026-02-10T08:12:00Z",
      last_seen_handshake_at: "2026-03-10T10:10:00Z",
      confirmed_connected_at: "2026-03-10T10:11:00Z",
      status: "connected",
      revoked_at: null,
    },
    {
      id: "dev-2",
      device_name: "Pixel 9",
      issued_at: "2026-02-18T11:00:00Z",
      last_seen_handshake_at: "2026-03-10T09:20:00Z",
      confirmed_connected_at: "2026-03-10T09:25:00Z",
      status: "active",
      revoked_at: null,
    },
    {
      id: "dev-3",
      device_name: "iPad Pro",
      issued_at: "2026-02-28T07:50:00Z",
      last_seen_handshake_at: "2026-03-09T21:02:00Z",
      confirmed_connected_at: "2026-03-09T21:10:00Z",
      status: "active",
      revoked_at: null,
    },
  ],
};

export const activeServers = {
  auto_select: false,
  total: 3,
  items: [
    { id: "srv-amsterdam", name: "Amsterdam", region: "NL", avg_ping_ms: 41, load_percent: 28, is_recommended: true, is_current: true },
    { id: "srv-frankfurt", name: "Frankfurt", region: "DE", avg_ping_ms: 76, load_percent: 44, is_recommended: false, is_current: false },
    { id: "srv-paris", name: "Paris", region: "FR", avg_ping_ms: 132, load_percent: 62, is_recommended: false, is_current: false },
  ],
};

export const activeUsage = {
  points: [
    { ts: "2026-03-04T00:00:00Z", bytes_in: 420_000_000, bytes_out: 140_000_000 },
    { ts: "2026-03-05T00:00:00Z", bytes_in: 380_000_000, bytes_out: 120_000_000 },
    { ts: "2026-03-06T00:00:00Z", bytes_in: 520_000_000, bytes_out: 160_000_000 },
    { ts: "2026-03-07T00:00:00Z", bytes_in: 610_000_000, bytes_out: 180_000_000 },
    { ts: "2026-03-08T00:00:00Z", bytes_in: 700_000_000, bytes_out: 240_000_000 },
    { ts: "2026-03-09T00:00:00Z", bytes_in: 760_000_000, bytes_out: 280_000_000 },
    { ts: "2026-03-10T00:00:00Z", bytes_in: 840_000_000, bytes_out: 320_000_000 },
  ],
  sessions: 7,
};

export const billingHistory = {
  items: [
    {
      payment_id: "pay-1",
      created_at: "2026-02-20T11:00:00Z",
      amount: 79,
      status: "paid",
      plan_name: "Pro Annual",
      invoice_ref: "webapp:telegram_stars:inv-annual-20260220",
      plan_id: "pro-annual",
    },
    {
      payment_id: "pay-2",
      created_at: "2025-02-20T11:00:00Z",
      amount: 79,
      status: "paid",
      plan_name: "Pro Annual",
      invoice_ref: "webapp:telegram_stars:inv-annual-20250220",
      plan_id: "pro-annual",
    },
  ],
  total: 2,
};

export const referralLink = {
  payload: "ref_abc123",
  bot_username: "vpn_suite_bot",
};

export const referralStatsActive = {
  earned_days: 21,
  total_referrals: 4,
  pending_rewards: 1,
  active_referrals: 3,
  invite_goal: 5,
  invite_progress: 3,
  invite_remaining: 2,
  pending_reward_days: 7,
};

export const subscriptionOffers = {
  subscription_id: "sub-active",
  status: "active",
  valid_until: "2026-03-24T12:00:00Z",
  discount_percent: 20,
  can_pause: true,
  can_resume: false,
  offer_pause: true,
  offer_discount: true,
  offer_downgrade: false,
  reason_group: "not_needed",
};

export const promoValidate = {
  valid: true,
  discount_xtr: 15,
  discounted_price_xtr: 64,
  display_label: "Promo applied",
};

export const createInvoice = {
  payment_id: "invoice-1",
  invoice_link: "https://t.me/invoice/mock",
  invoice_url: "https://t.me/invoice/mock",
  star_count: 79,
  free_activation: false,
};

export const paymentStatus = {
  status: "pending",
};

export const accessReady: Record<string, unknown> = {
  status: "ready",
  has_plan: true,
  devices_used: 2,
  device_limit: 3,
  config_ready: true,
  config_id: "dev-mac-active",
  expires_at: "2026-03-24T12:00:00Z",
  amnezia_vpn_key: "vpn://storybook-amnezia-key",
};

export const accessNoDevices: Record<string, unknown> = {
  ...accessReady,
  devices_used: 0,
  status: "needs_device",
};

export const accessNoPlan: Record<string, unknown> = {
  status: "no_plan",
  has_plan: false,
  devices_used: 0,
  device_limit: null,
  config_ready: false,
  config_id: null,
  expires_at: null,
  amnezia_vpn_key: null,
};

export const accessExpired: Record<string, unknown> = {
  status: "expired",
  has_plan: true,
  devices_used: 3,
  device_limit: 5,
  config_ready: false,
  config_id: null,
  expires_at: "2026-03-05T12:00:00Z",
  amnezia_vpn_key: null,
};

export const accessTrialEnding: Record<string, unknown> = {
  ...accessReady,
  devices_used: 0,
  device_limit: 2,
  expires_at: "2026-03-13T12:00:00Z",
};

export const accessExpiring: Record<string, unknown> = {
  ...accessReady,
  devices_used: 0,
  device_limit: 5,
  expires_at: "2026-03-25T12:00:00Z",
};

export const supportFaqDefault = {
  items: [
    {
      title_key: "support.faq_item_connection_title",
      body_key: "support.faq_item_connection_body",
    },
    {
      title_key: "support.faq_item_install_title",
      body_key: "support.faq_item_install_body",
    },
  ],
};
