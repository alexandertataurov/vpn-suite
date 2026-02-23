import { describe, it, expect } from "vitest";
import { deriveKpiStats } from "./selectors";
import type { OverviewStats } from "@vpn-suite/shared/types";

describe("deriveKpiStats", () => {
  it("returns empty array when overview is null", () => {
    expect(deriveKpiStats(null)).toEqual([]);
  });

  it("returns five KPI stats with correct labels and values", () => {
    const overview: OverviewStats = {
      servers_total: 10,
      servers_unhealthy: 2,
      peers_total: 200,
      users_total: 100,
      subscriptions_active: 50,
      mrr: 1200.5,
    };
    const stats = deriveKpiStats(overview);
    expect(stats).toHaveLength(5);
    expect(stats[0]!).toMatchObject({ label: "Servers", value: "10", state: "warning", to: "/servers" });
    expect(stats[0]!.subtitle).toBe("2 unhealthy");
    expect(stats[1]).toMatchObject({ label: "Peers", value: "200", to: "/devices" });
    expect(stats[2]).toMatchObject({ label: "Users", value: "100", to: "/users" });
    expect(stats[3]).toMatchObject({ label: "Subscriptions", value: "50", to: "/billing?tab=subscriptions" });
    expect(stats[4]!).toMatchObject({ label: "MRR", value: "1,200.5 USD" });
    expect(stats[4]!.to).toBeUndefined();
  });

  it("uses success state for servers when none unhealthy", () => {
    const overview: OverviewStats = {
      servers_total: 5,
      servers_unhealthy: 0,
      peers_total: 0,
      users_total: 0,
      subscriptions_active: 0,
      mrr: 0,
    };
    const stats = deriveKpiStats(overview);
    expect(stats[0]!.state).toBe("success");
    expect(stats[0]!.subtitle).toBe("5 online");
  });
});
