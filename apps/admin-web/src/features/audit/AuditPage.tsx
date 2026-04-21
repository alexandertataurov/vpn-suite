import { useMemo, useState } from "react";
import { Button, DataTable, Input, Pagination, SectionHeader } from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { PageActionRow, PageFilterRow, PageTableFooter } from "@/layout/PageBlocks";
import { PageErrorState, PageLoadingState } from "@/layout/PageStates";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { formatRelative } from "@/shared/utils/format";
import type { AuditLogList } from "@/shared/types/admin-api";
import { auditKeys, buildAuditPath } from "./services/audit.query-keys";

const PAGE_SIZE = 20;

export function AuditPage() {
  const [filters, setFilters] = useState({ resourceType: "", resourceId: "", requestId: "" });
  const [draft, setDraft] = useState(filters);
  const [offset, setOffset] = useState(0);

  const path = useMemo(
    () =>
      buildAuditPath({
        limit: PAGE_SIZE,
        offset,
        resourceType: filters.resourceType,
        resourceId: filters.resourceId,
        requestId: filters.requestId,
      }),
    [filters, offset]
  );

  const { data, isLoading, isError, error, refetch, isRefetching } = useApiQuery<AuditLogList>(
    [...auditKeys.list(path)],
    path,
    { retry: 1, staleTime: 10_000 }
  );

  const rows = useMemo(() => {
    if (!data) return [];
    return data.items.map((row) => ({
      id: row.id,
      createdAt: (
        <span title={new Date(row.created_at).toLocaleString()}>
          {formatRelative(row.created_at)}
        </span>
      ),
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id ?? "—",
      adminId: row.admin_id ?? "system",
      requestId: row.request_id ?? "—",
    }));
  }, [data]);

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = () => {
    setFilters(draft);
    setOffset(0);
  };

  if (isLoading) {
    return <PageLoadingState title="Audit Log" pageClass="audit-page" dataTestId="audit-page" bodyHeight={260} />;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Failed to load audit entries";
    return <PageErrorState title="Audit Log" pageClass="audit-page" dataTestId="audit-page" message={message} onRetry={() => void refetch()} />;
  }

  return (
    <PageLayout
      title="Audit Log"
      description="Administrative actions across control-plane resources."
      pageClass="audit-page"
      dataTestId="audit-page"
      actions={
        <Button type="button" variant="default" onClick={() => void refetch()} disabled={isRefetching}>
          {isRefetching ? "Refreshing..." : "Refresh"}
        </Button>
      }
    >
      <section className="page-section">
        <SectionHeader label="Filters" />
        <PageFilterRow className="audit-page__filters">
          <label className="audit-page__filter">
            <span>Resource type</span>
            <Input
              size="sm"
              value={draft.resourceType}
              onChange={(event) => setDraft((prev) => ({ ...prev, resourceType: event.target.value }))}
              placeholder="server, device, user"
            />
          </label>
          <label className="audit-page__filter">
            <span>Resource ID</span>
            <Input
              size="sm"
              value={draft.resourceId}
              onChange={(event) => setDraft((prev) => ({ ...prev, resourceId: event.target.value }))}
              placeholder="resource identifier"
            />
          </label>
          <label className="audit-page__filter">
            <span>Request ID</span>
            <Input
              size="sm"
              value={draft.requestId}
              onChange={(event) => setDraft((prev) => ({ ...prev, requestId: event.target.value }))}
              placeholder="trace request ID"
            />
          </label>
          <PageActionRow className="audit-page__actions">
            <Button type="button" variant="default" onClick={applyFilters}>
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const next = { resourceType: "", resourceId: "", requestId: "" };
                setDraft(next);
                setFilters(next);
                setOffset(0);
              }}
            >
              Reset
            </Button>
          </PageActionRow>
        </PageFilterRow>
      </section>

      <section className="page-section" aria-label="Audit log table">
        <div className="data-table-wrap">
          <DataTable
            density="compact"
            columns={[
              { key: "createdAt", header: "Created" },
              { key: "action", header: "Action" },
              { key: "resourceType", header: "Resource type" },
              { key: "resourceId", header: "Resource ID" },
              { key: "adminId", header: "Admin" },
              { key: "requestId", header: "Request ID" },
            ]}
            rows={rows}
            getRowKey={(row: { id: number }) => String(row.id)}
          />
        </div>
        <PageTableFooter className="audit-page__pagination">
          <Pagination page={page} pageCount={pageCount} onPageChange={(nextPage) => setOffset((nextPage - 1) * PAGE_SIZE)} />
          <span className="audit-page__meta">
            {rows.length} shown · {total} total
          </span>
        </PageTableFooter>
      </section>
    </PageLayout>
  );
}
