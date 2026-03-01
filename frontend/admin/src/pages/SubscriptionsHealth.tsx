import { useQuery } from "@tanstack/react-query";
import { PageContainer, Skeleton } from "@/design-system";
import { api } from "../api/client";
import { DashboardPage } from "../templates/DashboardPage";

interface RevenueOverview {
  subscriptions_active: number;
  expiring_3d: number;
  expired_today: number;
  churn_rate: number;
  renewal_rate: number;
}

export function SubscriptionsHealthPage() {
  const { data, error, isLoading } = useQuery<RevenueOverview>({
    queryKey: ["admin", "revenue", "overview"],
    queryFn: ({ signal }) => api.get<RevenueOverview>("/admin/revenue/overview", { signal }),
    staleTime: 60_000,
  });

  if (error) {
    return (
      <PageContainer>
        <DashboardPage className="ref-page" title="SUBSCRIPTIONS HEALTH">
          <p className="text-danger">{String(error)}</p>
        </DashboardPage>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <DashboardPage className="ref-page" title="SUBSCRIPTIONS HEALTH">
          <Skeleton height={120} />
        </DashboardPage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardPage className="ref-page" title="SUBSCRIPTIONS HEALTH">
      <div className="grid gap-3 mt-3 ref-auto-grid-180">
        <div className="card p-3">
          <div className="text-muted small">Active</div>
          <div className="h4 mb-0">{data.subscriptions_active}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Expiring in 3 days</div>
          <div className="h4 mb-0">{data.expiring_3d}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Expired today</div>
          <div className="h4 mb-0">{data.expired_today}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Churn rate</div>
          <div className="h4 mb-0">{data.churn_rate}%</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Renewal rate</div>
          <div className="h4 mb-0">{data.renewal_rate}%</div>
        </div>
      </div>
      </DashboardPage>
    </PageContainer>
  );
}
