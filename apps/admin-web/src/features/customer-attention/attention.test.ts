import { describe, expect, it } from "vitest";
import { computeCustomerAttention, getDeviceAttentionScore } from "./attention";
import type { DeviceOut, PaymentOut, SubscriptionOut, UserOut } from "@/shared/types/admin-api";

const now = new Date().toISOString();

const user: UserOut = {
  id: 11,
  tg_id: 9911,
  email: "user@example.com",
  phone: null,
  meta: null,
  is_banned: false,
  created_at: now,
  updated_at: now,
};

const activeSubscription: SubscriptionOut = {
  id: "sub-1",
  user_id: 11,
  plan_id: "plan-pro",
  status: "active",
  effective_status: "active",
  access_status: "enabled",
  billing_status: "paid",
  renewal_status: "renewing",
  valid_from: now,
  valid_until: new Date(Date.now() + 86_400_000).toISOString(),
  device_limit: 3,
  created_at: now,
};

const device: DeviceOut = {
  id: "dev-1",
  user_id: 11,
  subscription_id: "sub-1",
  server_id: "node-1",
  delivery_mode: "awg_native",
  device_name: "iphone",
  public_key: "pub",
  allowed_ips: null,
  issued_at: now,
  revoked_at: null,
  suspended_at: null,
  created_at: now,
  apply_status: "APPLIED",
  protocol_version: "awg",
  telemetry: {
    device_id: "dev-1",
    peer_present: false,
    node_health: "online",
    reconciliation_status: "broken",
    config_state: "issued",
    telemetry_reason: "Peer is missing from runtime",
    handshake_age_sec: null,
    handshake_latest_at: null,
    transfer_rx_bytes: 0,
    transfer_tx_bytes: 0,
    rtt_ms: null,
  },
};

const failedPayment: PaymentOut = {
  id: "pay-1",
  user_id: 11,
  subscription_id: "sub-1",
  provider: "telegram_stars",
  status: "failed",
  amount: 100,
  currency: "XTR",
  external_id: "ext-1",
  created_at: now,
};

describe("customer attention", () => {
  it("scores broken devices as needing attention", () => {
    expect(getDeviceAttentionScore(device)).toBeGreaterThanOrEqual(5);
  });

  it("orders critical billing and device signals before healthy states", () => {
    const summary = computeCustomerAttention({
      user,
      devices: [device],
      subscriptions: [activeSubscription],
      payments: [failedPayment],
      plans: [],
    });

    expect(summary.topSignal.severity).toBe("critical");
    expect(summary.signals.map((signal) => signal.title)).toEqual(
      expect.arrayContaining(["Device needs attention", "Payment failed"])
    );
  });

  it("flags an active subscription with no active devices", () => {
    const summary = computeCustomerAttention({
      user,
      devices: [],
      subscriptions: [activeSubscription],
      payments: [],
      plans: [],
    });

    expect(summary.topSignal.title).toBe("No devices");
    expect(summary.topSignal.severity).toBe("warning");
  });
});
