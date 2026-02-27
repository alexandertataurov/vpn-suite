import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer, Skeleton, Button } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

interface ChurnRiskUser {
  user_id: number;
  subscription_id: string | null;
  score: number;
  factors: Record<string, unknown> | null;
  computed_at: string;
}

interface ChurnRiskList {
  items: ChurnRiskUser[];
  total: number;
  revenue_at_risk: number;
}

export function ChurnPredictionPage() {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<ChurnRiskList>({
    queryKey: ["admin", "churn", "risk-list"],
    queryFn: ({ signal }) => api.get<ChurnRiskList>("/admin/churn/risk-list?min_score=0.5", { signal }),
    staleTime: 60_000,
  });

  const runMutation = useMutation({
    mutationFn: () => api.post("/admin/churn/run", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "churn"] }),
  });
  const runRetentionMutation = useMutation({
    mutationFn: () => api.post("/admin/retention/run", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "retention"] }),
  });

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Churn Prediction" />
        <p className="text-danger">{String(error)}</p>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Churn Prediction" />
        <Skeleton height={120} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Churn Prediction">
        <Button variant="secondary" size="sm" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
          Run prediction
        </Button>
        <Button variant="primary" size="sm" onClick={() => runRetentionMutation.mutate()} disabled={runRetentionMutation.isPending}>
          Apply retention campaign
        </Button>
      </PageHeader>
      <div className="d-flex gap-3 mb-3 flex-wrap">
        <div className="card p-3">
          <div className="text-muted small">High-risk users</div>
          <div className="h4 mb-0">{data.total}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Revenue at risk</div>
          <div className="h4 mb-0">{data.revenue_at_risk.toFixed(2)}</div>
        </div>
      </div>
      <div className="card p-3 mb-3 border-primary">
        <div className="small fw-medium mb-1">Suggested retention campaign</div>
        <p className="small text-muted mb-0">
          Target high-risk users with expiry reminders (3d / 1d) or a loyalty discount (e.g. 15%). Configure rules in{" "}
          <Link to="/retention">Retention Automation</Link>. Click &quot;Apply retention campaign&quot; to run the engine now.
        </p>
      </div>
      <div className="card">
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Subscription</th>
              <th>Score</th>
              <th>Factors</th>
              <th>Computed</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r, i) => (
              <tr key={`${r.user_id}-${r.subscription_id ?? ""}-${i}`}>
                <td>{r.user_id}</td>
                <td>{r.subscription_id ?? "—"}</td>
                <td>{(r.score * 100).toFixed(1)}%</td>
                <td><code>{r.factors ? JSON.stringify(r.factors) : "—"}</code></td>
                <td>{r.computed_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
