import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { Users } from "lucide-react";

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
        <Users className="icon-sm text-muted" />
        <span className="small text-muted fw-medium">Referrals</span>
        <Link to="/referrals" className="small ms-auto">View all</Link>
      </div>
      <div className="d-flex flex-wrap gap-3">
        <span><strong>Active referrers (30d)</strong> {data.active_referrers}</span>
        <span>Conversion: {data.referral_conversion_pct}%</span>
        <span>Paid (30d): {data.referral_paid_30d}</span>
        <span>Earned bonus days: {data.earned_bonus_days}</span>
      </div>
    </div>
  );
}
