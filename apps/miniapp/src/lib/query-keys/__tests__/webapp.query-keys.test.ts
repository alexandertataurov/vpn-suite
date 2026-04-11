import { describe, expect, it } from "vitest";
import { webappQueryKeys } from "../webapp.query-keys";

describe("webappQueryKeys", () => {
  it("builds stable root and leaf keys", () => {
    expect(webappQueryKeys.all).toEqual(["webapp"]);
    expect(webappQueryKeys.me()).toEqual(["webapp", "me"]);
    expect(webappQueryKeys.healthReady()).toEqual(["webapp", "health", "ready"]);
    expect(webappQueryKeys.servers()).toEqual(["webapp", "servers"]);
    expect(webappQueryKeys.usage("7d")).toEqual(["webapp", "usage", "7d"]);
    expect(webappQueryKeys.plans()).toEqual(["webapp", "plans"]);
    expect(webappQueryKeys.referralLink()).toEqual(["webapp", "referral", "link"]);
    expect(webappQueryKeys.referralStats()).toEqual(["webapp", "referral", "stats"]);
  });

  it("builds subscription offer and payment history keys with parameters", () => {
    expect(webappQueryKeys.subscriptionOffersRoot()).toEqual(["webapp", "subscription", "offers"]);
    expect(webappQueryKeys.subscriptionOffers("price")).toEqual(["webapp", "subscription", "offers", "price"]);
    expect(webappQueryKeys.subscriptionOffers(null)).toEqual(["webapp", "subscription", "offers", ""]);
    expect(webappQueryKeys.paymentsHistoryRoot()).toEqual(["webapp", "payments", "history"]);
    expect(webappQueryKeys.paymentsHistory(8)).toEqual(["webapp", "payments", "history", 8]);
  });
});
