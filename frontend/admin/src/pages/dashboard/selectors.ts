import type { LucideIcon } from "@/design-system/icons";
import { IconTelemetry, IconCpu, IconServer, IconTrend, IconUsers } from "@/design-system/icons";
import type { OverviewStats } from "@vpn-suite/shared/types";
/** Maps to MetricTile status where applicable: success->nominal, warning->warning, error->abort. */
export type KpiStatState = "default" | "primary" | "success" | "warning" | "error";

export interface KpiStat {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  state: KpiStatState;
  /** For drilldown: path to list page */
  to?: string;
}

/**
 * Derive health + capacity KPI stats from OverviewStats for MetricTiles.
 * Health: servers, peers. Capacity: users, subs, MRR.
 */
export function deriveKpiStats(overview: OverviewStats | null): KpiStat[] {
  if (!overview) return [];
  const healthy = Math.max(0, overview.servers_total - overview.servers_unhealthy);
  return [
    {
      label: "Servers",
      value: overview.servers_total.toLocaleString(),
      subtitle: overview.servers_unhealthy > 0 ? `${overview.servers_unhealthy} unhealthy` : `${healthy} online`,
      icon: IconServer,
      state: overview.servers_unhealthy > 0 ? "warning" : "success",
      to: "/servers",
    },
    {
      label: "Peers",
      value: (overview.peers_total ?? 0).toLocaleString(),
      subtitle: "Active devices",
      icon: IconCpu,
      state: "primary",
      to: "/devices",
    },
    {
      label: "Users",
      value: overview.users_total.toLocaleString(),
      subtitle: `${overview.subscriptions_active.toLocaleString()} active subscriptions`,
      icon: IconUsers,
      state: "primary",
      to: "/users",
    },
    {
      label: "Subscriptions",
      value: overview.subscriptions_active.toLocaleString(),
      subtitle: "Active paid",
      icon: IconTelemetry,
      state: "default",
      to: "/billing?tab=subscriptions",
    },
    {
      label: "MRR",
      value: `${(overview.mrr ?? 0).toLocaleString()} USD`,
      subtitle: "Monthly recurring revenue",
      icon: IconTrend,
      state: "default",
    },
  ];
}
