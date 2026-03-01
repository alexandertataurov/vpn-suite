import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { IconSubscriptions } from "@/design-system/icons";
import { DashboardStrip } from "./DashboardStrip";

interface RevenueOverview {
  subscriptions_active: number;
  expiring_3d: number;
  expired_today: number;
  churn_rate: number;
  renewal_rate: number;
}

export function SubscriptionHealthStrip() {
  const { data, isLoading, error } = useQuery<RevenueOverview>({
    queryKey: ["admin", "revenue", "overview"],
    queryFn: ({ signal }) => api.get<RevenueOverview>("/admin/revenue/overview", { signal }),
    staleTime: 60_000,
  });

  return (
    <DashboardStrip
      icon={IconSubscriptions}
      label="Subscription health"
      linkTo="/subscriptions-health"
      values={
        data ? (
          <>
            <span><strong>Active</strong> {data.subscriptions_active}</span>
            <span>Expiring in 3d: {data.expiring_3d}</span>
            <span>Expired today: {data.expired_today}</span>
            <span>Churn rate: {data.churn_rate}%</span>
            <span>Renewal rate: {data.renewal_rate}%</span>
          </>
        ) : null
      }
      isLoading={isLoading || (!data && !error)}
      error={error}
    />
  );
}
