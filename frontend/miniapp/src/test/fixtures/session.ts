import type { WebAppMeResponse } from "@vpn-suite/shared";

/** Minimal session with completed onboarding for tests. */
export const webappMeCompleted: WebAppMeResponse = {
  user: { id: 1, tg_id: 100 },
  subscriptions: [],
  devices: [],
  onboarding: { completed: true, step: 3, version: 2, updated_at: null },
};

/** Session with active subscription for tests. */
export const webappMeActive: WebAppMeResponse = {
  user: { id: 1, tg_id: 1001 },
  subscriptions: [
    {
      id: "sub-001",
      plan_id: "pro-monthly",
      status: "active",
      valid_until: "2026-03-21T12:00:00Z",
      device_limit: 3,
    },
  ],
  devices: [],
  public_ip: "185.199.110.42",
  onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-02-01T00:00:00Z" },
};
