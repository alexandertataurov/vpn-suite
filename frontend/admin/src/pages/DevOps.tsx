import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton, Button } from "@vpn-suite/shared/ui";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

interface DevOpsHealth {
  redis_ok: boolean;
  db_ok: boolean;
  node_discovery: string;
  node_scan_interval_seconds: number;
  node_mode: string;
  reconciliation_interval_seconds: number;
  reconciliation_read_only: boolean;
}

export function DevOpsPage() {
  const { data, error, isLoading } = useQuery<DevOpsHealth>({
    queryKey: ["admin", "devops", "health"],
    queryFn: ({ signal }) => api.get<DevOpsHealth>("/admin/devops/health", { signal }),
    staleTime: 10_000,
  });

  if (error) {
    return (
      <div className="ref-page">
        <PageHeader title="DevOps" />
        <p className="text-danger">{String(error)}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="ref-page">
        <PageHeader title="DevOps" />
        <Skeleton height={120} />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="devops-page">
      <PageHeader title="Infrastructure & DevOps">
        <Link to="/servers"><Button variant="secondary" size="sm">Servers</Button></Link>
        <Link to="/automation"><Button variant="ghost" size="sm">Automation</Button></Link>
      </PageHeader>
      <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        <div className={`card p-3 ${data.redis_ok ? "border-success" : "border-danger"}`}>
          <div className="text-muted small">Redis</div>
          <div className="h4 mb-0">{data.redis_ok ? "OK" : "Down"}</div>
        </div>
        <div className={`card p-3 ${data.db_ok ? "border-success" : "border-danger"}`}>
          <div className="text-muted small">Database</div>
          <div className="h4 mb-0">{data.db_ok ? "OK" : "Down"}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Node discovery</div>
          <div className="h4 mb-0">{data.node_discovery}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Node mode</div>
          <div className="h4 mb-0">{data.node_mode}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Node scan interval (s)</div>
          <div className="h4 mb-0">{data.node_scan_interval_seconds}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Reconciliation interval (s)</div>
          <div className="h4 mb-0">{data.reconciliation_interval_seconds}</div>
        </div>
        <div className="card p-3">
          <div className="text-muted small">Reconciliation read-only</div>
          <div className="h4 mb-0">{data.reconciliation_read_only ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
}
