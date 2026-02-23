import type { LucideIcon } from "lucide-react";
import { Activity, Cpu, Server, TrendingUp, Users } from "lucide-react";
import type { OverviewStats } from "@vpn-suite/shared/types";
import type { MetricTileState } from "../../components/MetricTile";

export interface KpiStat {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  state: MetricTileState;
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
      icon: Server,
      state: overview.servers_unhealthy > 0 ? "warning" : "success",
      to: "/servers",
    },
    {
      label: "Peers",
      value: (overview.peers_total ?? 0).toLocaleString(),
      subtitle: "Active devices",
      icon: Cpu,
      state: "primary",
      to: "/devices",
    },
    {
      label: "Users",
      value: overview.users_total.toLocaleString(),
      subtitle: `${overview.subscriptions_active.toLocaleString()} active subscriptions`,
      icon: Users,
      state: "primary",
      to: "/users",
    },
    {
      label: "Subscriptions",
      value: overview.subscriptions_active.toLocaleString(),
      subtitle: "Active paid",
      icon: Activity,
      state: "default",
      to: "/billing?tab=subscriptions",
    },
    {
      label: "MRR",
      value: `${(overview.mrr ?? 0).toLocaleString()} USD`,
      subtitle: "Monthly recurring revenue",
      icon: TrendingUp,
      state: "default",
    },
  ];
}
