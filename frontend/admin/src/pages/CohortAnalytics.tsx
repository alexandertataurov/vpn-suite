import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { useQuery } from "@tanstack/react-query";
import { PageContainer, Skeleton, Button } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { PageHeader } from "../components/PageHeader";

interface CohortRow {
  cohort_month: string;
  signups: number;
  retained_30d: number;
  retention_pct: number;
}

interface CohortList {
  items: CohortRow[];
}

export function CohortAnalyticsPage() {
  const { data, error, isLoading } = useQuery<CohortList>({
    queryKey: ["admin", "cohorts", "retention"],
    queryFn: ({ signal }) => api.get<CohortList>("/admin/cohorts/retention?months=12", { signal }),
    staleTime: 60_000,
  });

  const token = useAuthStore((s) => s.accessToken);
  const handleExport = async () => {
    const base = getBaseUrl().replace(/\/$/, "");
    const res = await fetch(`${base}/admin/cohorts/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cohort_retention.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleExportPrometheus = async () => {
    const base = getBaseUrl().replace(/\/$/, "");
    const res = await fetch(`${base}/admin/cohorts/export/prometheus?months=12`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const text = await res.text();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cohort_retention.prometheus.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Cohort Analytics" />
        <p className="text-danger">{String(error)}</p>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <PageHeader title="Cohort Analytics" />
        <Skeleton height={120} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Cohort Retention">
        <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
        <Button variant="ghost" size="sm" onClick={handleExportPrometheus}>Export Prometheus</Button>
      </PageHeader>
      <div className="card mt-3">
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th>Cohort (YYYY-MM)</th>
              <th>Signups</th>
              <th>Retained 30d</th>
              <th>Retention %</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.cohort_month}>
                <td>{r.cohort_month}</td>
                <td>{r.signups}</td>
                <td>{r.retained_30d}</td>
                <td>{r.retention_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
