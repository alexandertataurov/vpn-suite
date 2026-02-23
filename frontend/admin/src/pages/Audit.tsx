import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { formatDateTime, getErrorMessage } from "@vpn-suite/shared";
import { Table, PageError, Skeleton, Input, Select, Button, CodeText, Drawer } from "@vpn-suite/shared/ui";
import type { AuditLogOut, AuditLogList } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { useQuery } from "@tanstack/react-query";
import { AUDIT_KEY } from "../api/query-keys";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { TableSection } from "../components/TableSection";
import { Toolbar } from "../components/Toolbar";

const LIMIT = 50;

export function AuditPage() {
  const [offset, setOffset] = useState(0);
  const [resourceType, setResourceType] = useState<string>("");
  const [resourceId, setResourceId] = useState("");
  const [requestIdFilter, setRequestIdFilter] = useState("");
  const [detailsDrawer, setDetailsDrawer] = useState<AuditLogOut | null>(null);

  const queryParams = new URLSearchParams({
    limit: String(LIMIT),
    offset: String(offset),
  });
  if (resourceType) queryParams.set("resource_type", resourceType);
  if (resourceId.trim()) queryParams.set("resource_id", resourceId.trim());
  if (requestIdFilter.trim()) queryParams.set("request_id", requestIdFilter.trim());

  const { data, isLoading, error, refetch } = useQuery<AuditLogList>({
    queryKey: [...AUDIT_KEY, offset, resourceType, resourceId, requestIdFilter],
    queryFn: ({ signal }) => api.get<AuditLogList>(`/audit?${queryParams}`, { signal }),
  });

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        truncate: true,
        mono: true,
        titleTooltip: (r: AuditLogOut) => String(r.id),
        render: (r: AuditLogOut) => r.id,
      },
      { key: "created_at", header: "Time", numeric: true, render: (r: AuditLogOut) => formatDateTime(r.created_at) },
      { key: "actor", header: "Actor", render: (r: AuditLogOut) => r.admin_id ?? "-" },
      { key: "action", header: "Action", render: (r: AuditLogOut) => r.action },
      {
        key: "resource",
        header: "Resource",
        truncate: true,
        titleTooltip: (r: AuditLogOut) => {
          const s = [r.resource_type, r.resource_id].filter(Boolean).join(" ") || "-";
          return s;
        },
        render: (r: AuditLogOut) => [r.resource_type, r.resource_id].filter(Boolean).join(" ") || "-",
      },
      {
        key: "request_id",
        header: "Request ID",
        truncate: true,
        mono: true,
        titleTooltip: (r: AuditLogOut) => r.request_id ?? undefined,
        render: (r: AuditLogOut) => (r.request_id ? <CodeText>{r.request_id}</CodeText> : "-"),
      },
      {
        key: "old_new",
        header: "Details",
        actions: true,
        render: (r: AuditLogOut) =>
          r.old_new ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsDrawer(r)}
            >
              View
            </Button>
          ) : "-",
      },
    ],
    []
  );

  if (error) {
    return (
      <div className="ref-page" data-testid="audit-page">
        <PageHeader icon={FileText} title="Audit Log" description="Administrative actions and changes">
          <Button variant="secondary" size="sm" onClick={() => refetch()} aria-label="Retry">
            Retry
          </Button>
        </PageHeader>
        <PageError
          message={getErrorMessage(error, "Failed to load audit logs")}
          requestId={error instanceof ApiError ? error.requestId : undefined}
          statusCode={error instanceof ApiError ? error.statusCode : undefined}
          endpoint="GET /audit"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="audit-page">
      <PageHeader icon={FileText} title="Audit Log" description="Administrative actions and changes" />

      <TableSection
        pagination={data && data.total > LIMIT ? { offset, limit: LIMIT, total: data.total, onPage: setOffset } : undefined}
      >
        <Toolbar className="ref-toolbar-spaced">
          <Select
            options={[
              { value: "", label: "All types" },
              { value: "server", label: "Server" },
              { value: "device", label: "Device" },
              { value: "api", label: "API" },
            ]}
            value={resourceType}
            onChange={setResourceType}
            aria-label="Resource type"
          />
          <Input
            placeholder="Resource ID (e.g. server_id)"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            aria-label="Resource ID"
            className="ref-toolbar-input-md"
          />
          <Input
            placeholder="Request ID"
            value={requestIdFilter}
            onChange={(e) => setRequestIdFilter(e.target.value)}
            aria-label="Request ID"
            className="ref-toolbar-input-lg"
          />
          <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>
            Apply
          </Button>
        </Toolbar>
        {isLoading ? (
          <Skeleton height={220} />
        ) : (
          <Table
            columns={columns}
            data={data ? data.items : []}
            keyExtractor={(r) => String(r.id)}
            emptyMessage="No audit entries yet."
          />
        )}
      </TableSection>
      <Drawer
        open={!!detailsDrawer}
        onClose={() => setDetailsDrawer(null)}
        title="Audit details"
        width={480}
      >
        {detailsDrawer?.old_new && (
          <CodeText block className="overflow-auto max-w-full ref-audit-code-block">
            {JSON.stringify(detailsDrawer.old_new, null, 2)}
          </CodeText>
        )}
      </Drawer>
    </div>
  );
}
