import { useMemo } from "react";
import { formatDateTime, getErrorMessage } from "@vpn-suite/shared";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, Table, Skeleton, EmptyState, ErrorState } from "@vpn-suite/shared/ui";
import type { AuditLogList, AuditLogOut } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { AUDIT_KEY } from "../../api/query-keys";
import { logFrontendError } from "../../utils/logFrontendError";

export interface RecentAuditTableProps {
  limit?: number;
}

export function RecentAuditTable({ limit = 10 }: RecentAuditTableProps) {
  const queryKey = useMemo(() => [...AUDIT_KEY, "recent", limit] as const, [limit]);

  const { data, isLoading, error, refetch } = useQuery<AuditLogList>({
    queryKey,
    queryFn: ({ signal }) => api.get<AuditLogList>(`/audit?limit=${limit}&offset=0`, { signal }),
    staleTime: 30_000,
  });

  if (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const statusCode = error instanceof ApiError ? error.statusCode : undefined;
    logFrontendError({
      message: err.message,
      stack: err.stack ?? undefined,
      route: "Dashboard",
      widgetId: "recent-audit",
      statusCode,
    });
  }

  const columns = useMemo(
    () => [
      { key: "actor", header: "Actor", truncate: true, render: (r: AuditLogOut) => r.admin_id ?? "system" },
      { key: "action", header: "Action", truncate: true, render: (r: AuditLogOut) => r.action },
      {
        key: "resource",
        header: "Resource",
        truncate: true,
        render: (r: AuditLogOut) => {
          const label = [r.resource_type, r.resource_id].filter(Boolean).join(" ") || "—";
          const params = new URLSearchParams();
          if (r.resource_type) params.set("resource_type", r.resource_type);
          if (r.resource_id) params.set("resource_id", r.resource_id);
          const to = params.toString() ? `/audit?${params.toString()}` : "/audit";
          return <Link to={to}>{label}</Link>;
        },
      },
      {
        key: "created_at",
        header: "Time",
        truncate: true,
        numeric: true,
        render: (r: AuditLogOut) => formatDateTime(r.created_at),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <Panel as="section" variant="outline" aria-label="Recent audit" data-testid="dashboard-recent-audit">
        <h3 className="ref-settings-title">Recent audit</h3>
        <Skeleton height={120} />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel as="section" variant="outline" aria-label="Recent audit" data-testid="dashboard-recent-audit">
        <h3 className="ref-settings-title">Recent audit</h3>
        <ErrorState
          title="Failed to load"
          message={getErrorMessage(error, "Unknown error")}
          retry={() => refetch()}
          data-testid="dashboard-recent-audit-error"
        />
        <p className="ref-chart-subtitle">
          <Link to="/audit">View audit log</Link>
        </p>
      </Panel>
    );
  }

  const items = data?.items ?? [];

  return (
    <Panel as="section" variant="outline" aria-label="Recent audit" data-testid="dashboard-recent-audit">
      <div className="dashboard-widget-header">
        <h3 className="ref-settings-title">Recent audit</h3>
        <Link to="/audit" className="ref-link">
          View details
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="No audit entries yet."
          data-testid="dashboard-recent-audit-empty"
        />
      ) : (
        <Table
          columns={columns}
          data={items}
          keyFn={(r) => r.id}
          emptyMessage="No audit events"
          density="compact"
        />
      )}
    </Panel>
  );
}
