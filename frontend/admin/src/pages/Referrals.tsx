import { useQuery } from "@tanstack/react-query";
import { PageContainer, Skeleton } from "@/design-system";
import { api } from "../api/client";
import { DashboardPage } from "../templates/DashboardPage";

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
        <DashboardPage className="ref-page" title="REFERRALS">
          <p className="text-danger">{String(error)}</p>
        </DashboardPage>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <DashboardPage className="ref-page" title="REFERRALS">
          <Skeleton height={120} />
        </DashboardPage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardPage className="ref-page" title="REFERRAL METRICS">
      <div className="grid gap-3 mt-3 ref-auto-grid-180">
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
      </DashboardPage>
    </PageContainer>
  );
}
