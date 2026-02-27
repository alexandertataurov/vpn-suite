import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { EChart } from "../charts/EChart";

interface RevenueOverview {
  subscriptions_active: number;
  mrr: number;
  arr: number;
  revenue_today: number;
  revenue_7d: number;
  revenue_30d: number;
  arpu: number;
  trial_started_30d: number;
  trial_conversion_pct: number;
  avg_sub_length_days: number;
  expiring_3d: number;
  expired_today: number;
  churn_rate: number;
  renewal_rate: number;
  churn_by_reason: Record<string, number>;
  active_referrers: number;
  referral_conversion_pct: number;
  referral_paid_30d: number;
  earned_bonus_days: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
}

export function RevenuePage() {
  const { data, error, isLoading } = useQuery<RevenueOverview>({
    queryKey: ["admin", "revenue", "overview"],
    queryFn: ({ signal }) => api.get<RevenueOverview>("/admin/revenue/overview", { signal }),
    staleTime: 60_000,
  });
  const { data: dailyData } = useQuery<RevenueDay[]>({
    queryKey: ["admin", "revenue", "daily", 30],
    queryFn: ({ signal }) => api.get<RevenueDay[]>("/admin/revenue/daily?days=30", { signal }),
    staleTime: 60_000,
  });
  const chartOption = useMemo(() => {
    if (!dailyData?.length) return null;
    return {
      xAxis: { type: "category" as const, data: dailyData.map((d) => d.date.slice(5)) },
      yAxis: { type: "value" as const, name: "Revenue" },
      series: [{ type: "bar" as const, data: dailyData.map((d) => d.revenue), name: "Revenue" }],
      tooltip: { trigger: "axis" as const },
    };
  }, [dailyData]);

  if (error) {
    return (
      <div className="ref-page">
        <PageHeader title="Revenue" />
        <p className="text-danger">{String(error)}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="ref-page">
        <PageHeader title="Revenue" />
        <Skeleton height={120} />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="revenue-page">
      <PageHeader title="Revenue Overview" />
      <div className="revenue-kpis grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <div className="card p-3">
          <div className="text-muted small">MRR</div>
          <div className="h4 mb-0">{data.mrr.toFixed(2)}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">ARR</div>
          <div className="h4 mb-0">{data.arr.toFixed(2)}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Revenue today</div>
          <div className="h4 mb-0">{data.revenue_today.toFixed(2)}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Revenue 7d</div>
          <div className="h4 mb-0">{data.revenue_7d.toFixed(2)}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Revenue 30d</div>
          <div className="h4 mb-0">{data.revenue_30d.toFixed(2)}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">ARPU</div>
          <div className="h4 mb-0">{data.arpu.toFixed(2)}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Active subs</div>
          <div className="h4 mb-0">{data.subscriptions_active}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Trial → paid %</div>
          <div className="h4 mb-0">{data.trial_conversion_pct}%</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Avg sub length (days)</div>
          <div className="h4 mb-0">{data.avg_sub_length_days}</div>
        </div>
      </div>
      {chartOption && (
        <div className="card p-3 mt-3">
          <div className="text-muted small mb-2">Daily revenue (last 30 days)</div>
          <EChart option={chartOption} height={280} />
        </div>
      )}
      {Object.keys(data.churn_by_reason ?? {}).length > 0 && (
        <div className="card p-3 mt-3">
          <div className="text-muted small mb-2">Churn reasons (30d)</div>
          <ul className="list-unstyled mb-0">
            {Object.entries(data.churn_by_reason).map(([reason, count]) => (
              <li key={reason}>{reason}: {count}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
