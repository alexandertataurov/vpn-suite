import type { WebAppMeResponse } from "@vpn-suite/shared";
import { activeDevicesFixture } from "./device";
import { activePlanFixture } from "./plan";

export const webappMeActiveFixture: WebAppMeResponse = {
  user: { id: 1, tg_id: 1001 },
  subscriptions: [activePlanFixture],
  devices: [...activeDevicesFixture],
  public_ip: "185.199.110.42",
  onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-02-01T00:00:00Z" },
};

export const webappMeNoSubscriptionFixture: WebAppMeResponse = {
  user: { id: 2, tg_id: 1002 },
  subscriptions: [],
  devices: [],
  public_ip: null,
  onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-02-01T00:00:00Z" },
};

export const webappMeNoDevicesFixture: WebAppMeResponse = {
  user: { id: 3, tg_id: 1003 },
  subscriptions: [activePlanFixture],
  devices: [],
  public_ip: "185.199.110.42",
  onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-02-01T00:00:00Z" },
};

export const webappMeRevokedOnlyFixture: WebAppMeResponse = {
  user: { id: 4, tg_id: 1004 },
  subscriptions: [activePlanFixture],
  devices: activeDevicesFixture.map((device) => ({
    ...device,
    revoked_at: device.revoked_at ?? "2026-02-20T11:00:00Z",
  })),
  public_ip: "185.199.110.42",
  onboarding: { completed: true, step: 3, version: 2, updated_at: "2026-02-01T00:00:00Z" },
};

export const storyTextFixture = {
  veryLong:
    "This connected device is already using the maximum profile label length, so the row should wrap cleanly without pushing actions off-screen.",
  longLabel:
    "Use Telegram language preference unless this account needs a different support and billing language.",
} as const;
