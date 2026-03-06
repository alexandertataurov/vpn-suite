import type { WebAppMeResponse, WebAppMeDevice, WebAppMeSubscription } from "@/lib/types";

const baseSubscription: WebAppMeSubscription = {
  id: "sub-001",
  plan_id: "pro-monthly",
  status: "active",
  valid_until: "2026-03-21T12:00:00Z",
  device_limit: 3,
};

const devices: WebAppMeDevice[] = [
  {
    id: "dev-01",
    device_name: "MacBook Pro",
    issued_at: "2026-02-10T08:12:00Z",
    revoked_at: null,
  },
  {
    id: "dev-02",
    device_name: "Pixel 8",
    issued_at: "2026-02-11T09:42:00Z",
    revoked_at: null,
  },
  {
    id: "dev-03",
    device_name: "iPhone",
    issued_at: "2026-02-01T13:25:00Z",
    revoked_at: "2026-02-15T16:40:00Z",
  },
];

export const webappMeActive: WebAppMeResponse = {
  user: { id: 1, tg_id: 1001 },
  subscriptions: [baseSubscription],
  devices,
  onboarding: { completed: true, step: 2, version: 1, updated_at: "2026-02-01T00:00:00Z" },
};

export const webappMeNoSubscription: WebAppMeResponse = {
  user: { id: 2, tg_id: 1002 },
  subscriptions: [],
  devices: [],
  onboarding: { completed: true, step: 2, version: 1, updated_at: "2026-02-01T00:00:00Z" },
};

export const webappMeNoDevices: WebAppMeResponse = {
  user: { id: 3, tg_id: 1003 },
  subscriptions: [baseSubscription],
  devices: [],
  onboarding: { completed: true, step: 2, version: 1, updated_at: "2026-02-01T00:00:00Z" },
};

export const webappMeRevokedOnly: WebAppMeResponse = {
  user: { id: 4, tg_id: 1004 },
  subscriptions: [baseSubscription],
  devices: devices.map((d) => ({ ...d, revoked_at: d.revoked_at ?? "2026-02-20T11:00:00Z" })),
  onboarding: { completed: true, step: 2, version: 1, updated_at: "2026-02-01T00:00:00Z" },
};
