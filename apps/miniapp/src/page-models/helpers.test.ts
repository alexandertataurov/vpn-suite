import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  daysUntil,
  getActiveDevices,
  getActiveSubscription,
  getConfirmedDevices,
  getLatestActiveDevice,
  getPrimarySubscription,
  getRenewalCheckoutPath,
  getUpgradeCheckoutPath,
  getUpgradeCheckoutPathForDeviceLimit,
  hasConfirmedConnection,
  shouldShowUpsell,
} from "./helpers";

function makeSubscription(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "sub-1",
    plan_id: "plan-pro",
    status: "active",
    subscription_status: "active",
    access_status: "enabled",
    valid_until: "2026-04-01T00:00:00+00:00",
    cancel_at_period_end: false,
    ...overrides,
  };
}

describe("page-model subscription helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefers enabled active subscription over newer paused subscription", () => {
    const paused = makeSubscription({
      id: "sub-paused",
      access_status: "paused",
      valid_until: "2026-06-01T00:00:00+00:00",
    });
    const enabled = makeSubscription({
      id: "sub-enabled",
      access_status: "enabled",
      valid_until: "2026-04-01T00:00:00+00:00",
    });

    const primary = getPrimarySubscription({
      subscriptions: [paused, enabled],
      devices: [],
      user: null,
      onboarding: { completed: true, step: 3, version: 2, updated_at: null },
      public_ip: null,
      routing: { recommended_route: "/plan", reason: "unknown" },
    } as never);

    expect(primary?.id).toBe("sub-enabled");
  });

  it("getActiveSubscription excludes paused access", () => {
    const paused = makeSubscription({
      id: "sub-paused",
      access_status: "paused",
    });
    const active = makeSubscription({
      id: "sub-active",
      access_status: "enabled",
    });

    const selected = getActiveSubscription({
      subscriptions: [paused, active],
      devices: [],
      user: null,
      onboarding: { completed: true, step: 3, version: 2, updated_at: null },
      public_ip: null,
      routing: { recommended_route: "/plan", reason: "unknown" },
    } as never);

    expect(selected?.id).toBe("sub-active");
  });

  it("prefers grace over pending and expired subscriptions", () => {
    const expired = makeSubscription({
      id: "sub-expired",
      subscription_status: "expired",
      valid_until: "2026-02-01T00:00:00+00:00",
    });
    const pending = makeSubscription({
      id: "sub-pending",
      subscription_status: "pending",
    });
    const grace = makeSubscription({
      id: "sub-grace",
      access_status: "grace",
    });

    const primary = getPrimarySubscription({
      subscriptions: [expired, pending, grace],
      devices: [],
      user: null,
      onboarding: { completed: true, step: 3, version: 2, updated_at: null },
      public_ip: null,
      routing: { recommended_route: "/plan", reason: "unknown" },
    } as never);

    expect(primary?.id).toBe("sub-grace");
  });

  it("returns active and connected devices, but does not treat status alone as confirmed setup", () => {
    const session = {
      user: {
        last_connection_confirmed_at: null,
      },
      devices: [
        { id: "dev-1", status: "connected", revoked_at: null },
        { id: "dev-2", status: "idle", revoked_at: null },
        { id: "dev-3", status: "connected", revoked_at: "2026-03-08T00:00:00Z" },
      ],
    };

    expect(getActiveDevices(session as never)).toHaveLength(2);
    expect(getConfirmedDevices(session as never).map((device) => device.id)).toEqual(["dev-1"]);
    expect(hasConfirmedConnection(session as never)).toBe(false);
    expect(getLatestActiveDevice(session as never)?.id).toBe("dev-1");
  });

  it("treats user-level confirmation as persistent even when devices are idle", () => {
    const session = {
      user: {
        last_connection_confirmed_at: "2026-03-08T00:00:00Z",
      },
      devices: [
        { id: "dev-1", status: "idle", revoked_at: null, last_connection_confirmed_at: null },
      ],
    };

    expect(hasConfirmedConnection(session as never)).toBe(true);
  });

  it("treats device-level confirmation as persistent even when status is idle", () => {
    const session = {
      user: {
        last_connection_confirmed_at: null,
      },
      devices: [
        {
          id: "dev-1",
          status: "idle",
          revoked_at: null,
          last_connection_confirmed_at: "2026-03-08T00:00:00Z",
        },
      ],
    };

    expect(hasConfirmedConnection(session as never)).toBe(true);
  });

  it("computes daysUntil defensively for valid and invalid timestamps", () => {
    expect(daysUntil("2026-03-11T00:00:00Z")).toBe(2);
    expect(daysUntil("not-a-date")).toBe(0);
    expect(daysUntil(null)).toBe(0);
  });

  it("shows upsell when methods are absent and hides when trigger is missing", () => {
    expect(shouldShowUpsell(undefined, "device_limit")).toBe(true);
    expect(shouldShowUpsell(["renewal"], "device_limit")).toBe(false);
    expect(shouldShowUpsell(["device_limit"], "device_limit")).toBe(true);
  });

  it("builds renewal and upgrade checkout paths from sorted plan order", () => {
    const plans = [
      { id: "pro", duration_days: 365, price_amount: 90, display_order: 2 },
      { id: "basic", duration_days: 30, price_amount: 5, display_order: 1 },
      { id: "plus", duration_days: 90, price_amount: 20, display_order: 2 },
    ];

    expect(getRenewalCheckoutPath("pro")).toBe("/plan/checkout/pro");
    expect(getRenewalCheckoutPath(null)).toBe("/plan");
    expect(getUpgradeCheckoutPath(plans, null)).toBe("/plan/checkout/basic");
    expect(getUpgradeCheckoutPath(plans, "basic")).toBe("/plan/checkout/plus");
    expect(getUpgradeCheckoutPath(plans, "pro")).toBe("/plan/checkout/pro");
    expect(getUpgradeCheckoutPath([], "basic")).toBe("/plan");
  });

  it("targets the next higher device-limit plan when available", () => {
    const plans = [
      { id: "basic", duration_days: 30, price_amount: 5, device_limit: 1, display_order: 2 },
      { id: "plus", duration_days: 30, price_amount: 8, device_limit: 3, display_order: 1 },
      { id: "max", duration_days: 30, price_amount: 12, device_limit: 5, display_order: 3 },
    ];

    expect(getUpgradeCheckoutPathForDeviceLimit(plans, "basic")).toBe(
      "/plan/checkout/plus?intent=device_limit",
    );
    expect(getUpgradeCheckoutPathForDeviceLimit(plans, "max")).toBe("/plan?intent=device_limit");
    expect(getUpgradeCheckoutPathForDeviceLimit([], "basic")).toBe("/plan?intent=device_limit");
  });
});
