import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, Table, Skeleton, ErrorState, RelativeTime } from "@/design-system";
import { EmptyState, Heading } from "@/design-system";
import type { ServerList, ServerOut } from "@vpn-suite/shared/types";
import { getErrorMessage } from "@vpn-suite/shared";
import { api } from "../../api/client";
import { SERVERS_LIST_DASHBOARD_KEY } from "../../api/query-keys";
import { logFrontendError } from "../../utils/logFrontendError";
import { ApiError } from "@vpn-suite/shared/types";

const FETCH_LIMIT = 200;
const ISSUE_SEVERITY: Record<ServerOut["status"], number> = {
  offline: 0,
  degraded: 1,
  unknown: 2,
  online: 3,
};

function effectiveRegion(regionFilter: string | null): string | null {
  if (regionFilter == null || regionFilter === "" || regionFilter === "all") return null;
  return regionFilter;
}

function buildQueryString(regionFilter: string | null): string {
  const params = new URLSearchParams();
  params.set("limit", String(FETCH_LIMIT));
  params.set("offset", "0");
  params.set("is_active", "true");
  const region = effectiveRegion(regionFilter);
  if (region) params.set("region", region);
  return `?${params.toString()}`;
}

export interface TopIssuesTableProps {
  regionFilter: string | null;
  limit?: number;
}

export function TopIssuesTable({ regionFilter, limit = 10 }: TopIssuesTableProps) {
  const queryKey = useMemo(
    () => [...SERVERS_LIST_DASHBOARD_KEY, regionFilter ?? "all", "issues"] as const,
    [regionFilter]
  );

  const { data, isLoading, error, refetch } = useQuery<ServerList>({
    queryKey,
    queryFn: ({ signal }) => api.get<ServerList>(`/servers${buildQueryString(regionFilter)}`, { signal }),
    staleTime: 60_000,
  });

  const issues = useMemo(() => {
    if (!data?.items?.length) return [];
    const filtered = data.items.filter((s) => s.is_active && s.status !== "online");
    const bySeverity = (a: ServerOut, b: ServerOut) => {
      const severityCmp = (ISSUE_SEVERITY[a.status] ?? 99) - (ISSUE_SEVERITY[b.status] ?? 99);
      if (severityCmp !== 0) return severityCmp;
      if (a.last_seen_at == null && b.last_seen_at != null) return -1;
      if (a.last_seen_at != null && b.last_seen_at == null) return 1;
      if (a.last_seen_at != null && b.last_seen_at != null) {
        const tsDiff = new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime();
        if (tsDiff !== 0) return tsDiff;
      }
      return (a.name ?? a.id).localeCompare(b.name ?? b.id);
    };
    return [...filtered].sort(bySeverity).slice(0, limit);
  }, [data?.items, limit]);

  if (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const statusCode = error instanceof ApiError ? error.statusCode : undefined;
    logFrontendError({
      message: err.message,
      stack: err.stack ?? undefined,
      route: "Dashboard",
      widgetId: "top-issues",
      statusCode,
    });
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Server",
        truncate: true,
        render: (r: ServerOut) => (
          <Link to={`/servers/${r.id}`} title={r.name ?? r.id}>
            {r.name ?? r.id.slice(0, 8)}
          </Link>
        ),
      },
      { key: "region", header: "Region", truncate: true, render: (r: ServerOut) => r.region ?? "—" },
      { key: "status", header: "Status", render: (r: ServerOut) => r.status },
      { key: "last_seen", header: "Last seen", render: (r: ServerOut) => (r.last_seen_at ? <RelativeTime date={r.last_seen_at} /> : "—") },
    ],
    []
  );

  if (isLoading) {
    return (
      <Card as="section" variant="outline" aria-label="Top issues" data-testid="dashboard-top-issues">
        <Heading level={3} className="ref-settings-title">Top issues</Heading>
        <Skeleton height={120} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card as="section" variant="outline" aria-label="Top issues" data-testid="dashboard-top-issues">
        <Heading level={3} className="ref-settings-title">Top issues</Heading>
        <ErrorState
          title="Failed to load"
          message={getErrorMessage(error, "Unknown error")}
          retry={() => refetch()}
          data-testid="dashboard-top-issues-error"
        />
        <p className="ref-chart-subtitle">
          <Link to="/servers?status=offline">View servers</Link>
        </p>
      </Card>
    );
  }

  return (
    <Card as="section" variant="outline" aria-label="Top issues" data-testid="dashboard-top-issues">
      <div className="dashboard-widget-header">
        <Heading level={3} className="ref-settings-title">Top issues</Heading>
        <Link
          to={
            effectiveRegion(regionFilter)
              ? `/servers?status=offline&region=${encodeURIComponent(effectiveRegion(regionFilter)!)}`
              : "/servers?status=offline"
          }
          className="ref-link"
        >
          View details
        </Link>
      </div>
      {issues.length === 0 ? (
        <EmptyState
          title="No issues"
          description="No issues in this region."
          data-testid="dashboard-top-issues-empty"
        />
      ) : (
        <>
          <Table columns={columns} data={issues} keyFn={(r) => r.id} density="compact" />
        </>
      )}
    </Card>
  );
}
