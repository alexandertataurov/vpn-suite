import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { IconTrend } from "@/design-system/icons";
import { DashboardStrip } from "./DashboardStrip";

interface RevenueOverview {
  mrr: number;
  arr: number;
  revenue_7d: number;
  revenue_30d: number;
  subscriptions_active: number;
  expiring_3d: number;
  trial_conversion_pct: number;
  referral_conversion_pct: number;
}

export function RevenueStrip() {
  const { data, isLoading, error } = useQuery<RevenueOverview>({
    queryKey: ["admin", "revenue", "overview"],
    queryFn: ({ signal }) => api.get<RevenueOverview>("/admin/revenue/overview", { signal }),
    staleTime: 60_000,
  });

  return (
    <DashboardStrip
      icon={IconTrend}
      label="Revenue"
      linkTo="/revenue"
      values={
        data ? (
          <>
            <span><strong>MRR</strong> {data.mrr.toFixed(2)}</span>
            <span><strong>ARR</strong> {data.arr.toFixed(2)}</span>
            <span>7d: {data.revenue_7d.toFixed(2)}</span>
            <span>30d: {data.revenue_30d.toFixed(2)}</span>
            <span>Active: {data.subscriptions_active}</span>
            <span>Expiring 3d: {data.expiring_3d}</span>
            <span>Trial→Paid: {data.trial_conversion_pct}%</span>
            <span>Referral: {data.referral_conversion_pct}%</span>
          </>
        ) : null
      }
      isLoading={isLoading || (!data && !error)}
      error={error}
    />
  );
}
