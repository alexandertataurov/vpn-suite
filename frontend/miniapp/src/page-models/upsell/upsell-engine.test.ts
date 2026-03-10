import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";
import { evaluateUpsell } from "./evaluateUpsell";
import { getUpgradeCheckoutPathForDeviceLimit, getUpgradeOfferForIntent } from "./getUpgradeOfferForIntent";
import { getUpsellCopy } from "./getUpsellCopy";
import { shouldSuppressUpsell } from "./shouldSuppressUpsell";
import type { PlanLikeForUpsell, UpsellDecision, UpsellHistoryEntry } from "./upsell.types";

const t = (key: string, params?: Record<string, string | number>) =>
  translate("en", key, params as Record<string, string | number | boolean>);

const plans: PlanLikeForUpsell[] = [
  {
    id: "basic",
    name: "Basic",
    display_order: 2,
    duration_days: 30,
    device_limit: 1,
    price_amount: 199,
    upsell_methods: ["device_limit", "expiry", "referral"],
    recommended_upgrade_plan_id: "pro",
  },
  {
    id: "pro",
    name: "Pro",
    display_order: 1,
    duration_days: 90,
    device_limit: 3,
    price_amount: 399,
    upsell_methods: ["device_limit", "expiry", "trial_end", "referral"],
  },
  {
    id: "family",
    name: "Family",
    display_order: 3,
    duration_days: 365,
    device_limit: 5,
    price_amount: 699,
  },
];

describe("upsell engine", () => {
  it("prefers device-limit upsell over lower-priority triggers", () => {
    const decision = evaluateUpsell(
      {
        page: "devices",
        currentPlan: plans[0],
        currentPlanId: "basic",
        plans,
        subscriptionStatus: "grace",
        daysToExpiry: 3,
        devicesUsed: 1,
        deviceLimit: 1,
      },
      t,
    );

    expect(decision).toMatchObject({
      trigger: "device_limit",
      targetTo: "/plan/checkout/pro?intent=device_limit",
      ctaLabel: "Upgrade plan",
    });
  });

  it("excludes expiry upsell from home page (shown in notifications instead)", () => {
    const decision = evaluateUpsell(
      {
        page: "home",
        currentPlan: plans[0],
        currentPlanId: "basic",
        plans,
        subscriptionStatus: "active",
        daysToExpiry: 3,
        devicesUsed: 0,
        deviceLimit: 3,
      },
      t,
    );

    expect(decision).toBeNull();
  });

  it("returns null on checkout page", () => {
    const decision = evaluateUpsell(
      {
        page: "checkout",
        currentPlan: plans[0],
        currentPlanId: "basic",
        plans,
        subscriptionStatus: "expired",
        daysToExpiry: 0,
      },
      t,
    );

    expect(decision).toBeNull();
  });

  it("skips suppressed trigger and falls back to next candidate", () => {
    const history: UpsellHistoryEntry[] = [
      {
        trigger: "device_limit",
        page: "devices",
        shownAt: "2026-03-08T10:00:00Z",
        dismissedAt: "2026-03-09T09:00:00Z",
      },
    ];

    const decision = evaluateUpsell(
      {
        page: "devices",
        currentPlan: plans[0],
        currentPlanId: "basic",
        plans,
        subscriptionStatus: "expired",
        daysToExpiry: 0,
        devicesUsed: 1,
        deviceLimit: 1,
        recentUpsellHistory: history,
        sessionShownTriggers: [],
      },
      t,
    );

    expect(decision?.trigger).toBe("expiry");
    expect(decision?.targetTo).toBe("/plan/checkout/basic?intent=expiry");
  });

  it("deduplicates within a session", () => {
    const result = shouldSuppressUpsell("referral", [], ["referral"], new Date("2026-03-09T12:00:00Z"));
    expect(result).toEqual({ suppressed: true, reason: "session_deduplication" });
  });

  it("suppresses recently dismissed offers inside cooldown", () => {
    const result = shouldSuppressUpsell(
      "device_limit",
      [
        {
          trigger: "device_limit",
          page: "devices",
          shownAt: "2026-03-08T12:00:00Z",
          dismissedAt: "2026-03-09T00:00:00Z",
        },
      ],
      [],
      new Date("2026-03-09T06:00:00Z"),
    );

    expect(result).toEqual({ suppressed: true, reason: "offer_dismissed_recently" });
  });

  it("builds the device-limit checkout path by upgraded capacity", () => {
    expect(getUpgradeCheckoutPathForDeviceLimit(plans, "basic")).toBe("/plan/checkout/pro?intent=device_limit");
    expect(getUpgradeCheckoutPathForDeviceLimit([plans[0]], "basic")).toBe("/plan?intent=device_limit");
  });

  it("resolves referral offer using recommended target", () => {
    const decision = getUpgradeOfferForIntent(plans, plans[0], "referral", "referral", t);
    expect(decision).toMatchObject({
      trigger: "referral",
      targetPlanId: "pro",
      targetTo: "/plan/checkout/pro?intent=referral",
      title: "Unlock referral rewards",
      ctaLabel: "Unlock rewards",
    });
  });

  it("generates trigger-specific copy variants", () => {
    const decision: UpsellDecision = {
      show: true,
      trigger: "trial_end",
      priority: 85,
      targetTo: "/plan/checkout/pro?intent=trial_end",
      reason: "intent_trial_end",
      offerType: "trial_convert",
      uiVariant: "card",
      title: "",
      body: "",
      ctaLabel: "",
      targetPlanId: "pro",
    };

    expect(getUpsellCopy(t, decision, { currentPlan: plans[0], plans })).toEqual({
      title: "Trial ending soon",
      body: "Choose paid plan to keep access.",
      ctaLabel: "Choose paid plan",
    });
  });
});
