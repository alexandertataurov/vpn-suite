import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { CreditCard } from "lucide-react";

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

  if (error) return null;
  if (isLoading || !data) {
    return (
      <div className="card p-3 mb-3">
        <Skeleton height={48} />
      </div>
    );
  }

  return (
    <div className="card p-3 mb-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <CreditCard className="icon-sm text-muted" />
        <span className="small text-muted fw-medium">Subscription health</span>
        <Link to="/subscriptions-health" className="small ms-auto">View all</Link>
      </div>
      <div className="d-flex flex-wrap gap-3">
        <span><strong>Active</strong> {data.subscriptions_active}</span>
        <span>Expiring in 3d: {data.expiring_3d}</span>
        <span>Expired today: {data.expired_today}</span>
        <span>Churn rate: {data.churn_rate}%</span>
        <span>Renewal rate: {data.renewal_rate}%</span>
      </div>
    </div>
  );
}
