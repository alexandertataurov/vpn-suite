import { useCallback, useMemo, useState } from "react";
import { useApi } from "@/core/api/context";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { Button, Card, DataTable, ErrorState, Input, SectionHeader, Skeleton } from "@/design-system/primitives";
import { MetaText } from "@/design-system/typography";
import { PageLayout } from "@/layout/PageLayout";
import type { AutomationRunOut, AutomationStatusOut } from "@/shared/types/admin-api";

interface ClusterHealthOut {
  status?: string;
  healthy_nodes?: number;
  total_nodes?: number;
  unhealthy_nodes?: number;
  timestamp?: string;
}

export function AutomationPage() {
  const api = useApi();
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<AutomationRunOut | null>(null);
  const [batchSize, setBatchSize] = useState("5");
  const [maxExecutions, setMaxExecutions] = useState("10");

  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
  } = useApiQuery<AutomationStatusOut>(["automation", "status"], "/control-plane/automation/status", {
    retry: 1,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const {
    data: clusterHealth,
    refetch: refetchClusterHealth,
  } = useApiQuery<ClusterHealthOut>(["cluster", "health"], "/cluster/health", {
    retry: 1,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const refreshAll = useCallback(() => {
    void refetchStatus();
    void refetchClusterHealth();
  }, [refetchClusterHealth, refetchStatus]);

  const runAutomation = useCallback(
    async (executeRebalance: boolean) => {
      setActionPending(true);
      setActionError(null);
      try {
        const result = await api.post<AutomationRunOut>("/control-plane/automation/run", {
          execute_rebalance: executeRebalance,
          batch_size: Number.parseInt(batchSize, 10) || undefined,
          max_executions: Number.parseInt(maxExecutions, 10) || undefined,
        });
        setRunResult(result);
        refreshAll();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Automation run failed");
      } finally {
        setActionPending(false);
      }
    },
    [api, batchSize, maxExecutions, refreshAll]
  );

  const runClusterAction = useCallback(
    async (path: "/cluster/scan" | "/cluster/resync") => {
      setActionPending(true);
      setActionError(null);
      try {
        await api.post(path);
        refreshAll();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Cluster action failed");
      } finally {
        setActionPending(false);
      }
    },
    [api, refreshAll]
  );

  const latestRun = runResult ?? status?.last_run ?? null;

  const runRows = useMemo(() => {
    if (!latestRun?.executions?.length) return [];
    return latestRun.executions.map((entry, idx) => ({
      id: `${entry.source_node_id}-${entry.target_node_id}-${idx}`,
      source: entry.source_node_id,
      target: entry.target_node_id,
      requested: entry.requested,
      attempted: entry.attempted,
      succeeded: entry.succeeded,
      failed: entry.failed,
      status: entry.status,
    }));
  }, [latestRun]);

  if (isStatusLoading) {
    return (
      <PageLayout title="Automation" pageClass="automation-page" dataTestId="automation-page" hideHeader>
        <Skeleton height={32} width="30%" />
        <Skeleton height={220} />
      </PageLayout>
    );
  }

  if (isStatusError) {
    return (
      <PageLayout title="Automation" pageClass="automation-page" dataTestId="automation-page" hideHeader>
        <ErrorState
          message={statusError instanceof Error ? statusError.message : "Failed to load automation status"}
          onRetry={refreshAll}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Automation"
      description="Control-plane automation and cluster reconciliation"
      pageClass="automation-page"
      dataTestId="automation-page"
      actions={
        <Button type="button" variant="default" onClick={refreshAll} disabled={actionPending}>
          Refresh
        </Button>
      }
    >
      <Card>
        <SectionHeader label="Automation status" />
        <div className="billing-page__filters">
          <label className="input-label">
            Batch size
            <Input type="number" min={1} value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
          </label>
          <label className="input-label">
            Max executions
            <Input type="number" min={1} value={maxExecutions} onChange={(e) => setMaxExecutions(e.target.value)} />
          </label>
          <div className="billing-page__filter-actions">
            <Button type="button" variant="default" disabled={actionPending} onClick={() => void runAutomation(false)}>
              Run dry-run
            </Button>
            <Button type="button" variant="warning" disabled={actionPending} onClick={() => void runAutomation(true)}>
              Run execute
            </Button>
          </div>
        </div>
        <div className="devices-page__detail-dl">
          <dt>Enabled</dt>
          <dd>{status?.enabled ? "Yes" : "No"}</dd>
          <dt>Interval</dt>
          <dd>{status?.interval_seconds ?? "—"} s</dd>
          <dt>Health threshold</dt>
          <dd>{status?.unhealthy_health_threshold ?? "—"}</dd>
          <dt>Rebalance execute</dt>
          <dd>{status?.rebalance_execute_enabled ? "On" : "Off"}</dd>
          <dt>Cluster health</dt>
          <dd>
            {clusterHealth?.healthy_nodes ?? "—"}/{clusterHealth?.total_nodes ?? "—"} healthy
          </dd>
          <dt>Last run</dt>
          <dd>{status?.last_run_at ? new Date(status.last_run_at).toLocaleString() : "Never"}</dd>
        </div>
      </Card>

      <Card>
        <SectionHeader label="Cluster operations" />
        <div className="devices-page__detail-buttons">
          <Button type="button" variant="secondary" disabled={actionPending} onClick={() => void runClusterAction("/cluster/scan")}>Discover nodes</Button>
          <Button type="button" variant="secondary" disabled={actionPending} onClick={() => void runClusterAction("/cluster/resync")}>Resync topology</Button>
        </div>
      </Card>

      {actionError && (
        <div className="alert danger" role="alert">
          <span className="alert-icon" aria-hidden />
          <div>
            <div className="alert-title">Automation action failed</div>
            <div className="alert-desc">{actionError}</div>
          </div>
        </div>
      )}

      <Card>
        <SectionHeader label="Latest automation run" />
        {latestRun ? (
          <>
            <MetaText>
              Load {latestRun.load_factor.toFixed(2)} · health {latestRun.health_score.toFixed(1)} · migrations {latestRun.executed_migrations}
            </MetaText>
            {runRows.length > 0 ? (
              <div className="data-table-wrap">
                <DataTable
                  density="compact"
                  columns={[
                    { key: "source", header: "Source node" },
                    { key: "target", header: "Target node" },
                    { key: "requested", header: "Requested" },
                    { key: "attempted", header: "Attempted" },
                    { key: "succeeded", header: "Succeeded" },
                    { key: "failed", header: "Failed" },
                    { key: "status", header: "Status" },
                  ]}
                  rows={runRows}
                  getRowKey={(row: { id: string }) => row.id}
                />
              </div>
            ) : (
              <MetaText>No execution details available for the latest run.</MetaText>
            )}
          </>
        ) : (
          <MetaText>No automation run has been recorded yet.</MetaText>
        )}
      </Card>
    </PageLayout>
  );
}
