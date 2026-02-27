import { useQuery } from "@tanstack/react-query";
import { PageContainer, Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

interface RevenueOverview {
  active_referrers: number;
  referral_conversion_pct: number;
  referral_paid_30d: number;
  earned_bonus_days: number;
}

export function ReferralsPage() {
  const { data, error, isLoading } = useQuery<RevenueOverview>({
    queryKey: ["admin", "revenue", "overview"],
    queryFn: ({ signal }) => api.get<RevenueOverview>("/admin/revenue/overview", { signal }),
    staleTime: 60_000,
  });

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Referrals" />
        <p className="text-danger">{String(error)}</p>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Referrals" />
        <Skeleton height={120} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Referral Metrics" />
      <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <div className="card p-3">
          <div className="text-muted small">Active referrers (30d)</div>
          <div className="h4 mb-0">{data.active_referrers}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Referral conversion %</div>
          <div className="h4 mb-0">{data.referral_conversion_pct}%</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Referrals paid (30d)</div>
          <div className="h4 mb-0">{data.referral_paid_30d}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Earned bonus days</div>
          <div className="h4 mb-0">{data.earned_bonus_days}</div>
        </div>
      </div>
    </PageContainer>
  );
}
