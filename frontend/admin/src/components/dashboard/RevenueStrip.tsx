import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { TrendingUp } from "lucide-react";

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
        <TrendingUp className="icon-sm text-muted" />
        <span className="small text-muted fw-medium">Revenue</span>
        <Link to="/revenue" className="small ms-auto">View all</Link>
      </div>
      <div className="d-flex flex-wrap gap-3">
        <span><strong>MRR</strong> {data.mrr.toFixed(2)}</span>
        <span><strong>ARR</strong> {data.arr.toFixed(2)}</span>
        <span>7d: {data.revenue_7d.toFixed(2)}</span>
        <span>30d: {data.revenue_30d.toFixed(2)}</span>
        <span>Active: {data.subscriptions_active}</span>
        <span>Expiring 3d: {data.expiring_3d}</span>
        <span>Trial→Paid: {data.trial_conversion_pct}%</span>
        <span>Referral: {data.referral_conversion_pct}%</span>
      </div>
    </div>
  );
}
