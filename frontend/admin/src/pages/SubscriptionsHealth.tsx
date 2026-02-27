import { useQuery } from "@tanstack/react-query";
import { PageContainer, Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

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
        <PageHeader title="Subscriptions Health" />
        <p className="text-danger">{String(error)}</p>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Subscriptions Health" />
        <Skeleton height={120} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Subscriptions Health" />
      <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
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
    </PageContainer>
  );
}
