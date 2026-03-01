import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { IconUsers } from "@/design-system/icons";
import { DashboardStrip } from "./DashboardStrip";

interface RevenueOverview {
  active_referrers: number;
  referral_conversion_pct: number;
  referral_paid_30d: number;
  earned_bonus_days: number;
}

export function ReferralStrip() {
  const { data, isLoading, error } = useQuery<RevenueOverview>({
    queryKey: ["admin", "revenue", "overview"],
    queryFn: ({ signal }) => api.get<RevenueOverview>("/admin/revenue/overview", { signal }),
    staleTime: 60_000,
  });

  return (
    <DashboardStrip
      icon={IconUsers}
      label="Referrals"
      linkTo="/referrals"
      values={
        data ? (
          <>
            <span><strong>Active referrers (30d)</strong> {data.active_referrers}</span>
            <span>Conversion: {data.referral_conversion_pct}%</span>
            <span>Paid (30d): {data.referral_paid_30d}</span>
            <span>Earned bonus days: {data.earned_bonus_days}</span>
          </>
        ) : null
      }
      isLoading={isLoading || (!data && !error)}
      error={error}
    />
  );
}
