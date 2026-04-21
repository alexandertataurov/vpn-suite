import { useCallback, useMemo, useState } from "react";
import { useApi } from "@/core/api/context";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { Button, Card, DataTable, Input, SectionHeader } from "@/design-system/primitives";
import { MetaText } from "@/design-system/typography";
import { PageLayout } from "@/layout/PageLayout";
import { PageActionRow, PageFilterRow, PageKeyValueList } from "@/layout/PageBlocks";
import { PageErrorState, PageLoadingState } from "@/layout/PageStates";
import type { AutomationRunOut, AutomationStatusOut } from "@/shared/types/admin-api";
import { automationKeys, clusterKeys } from "./services/automation.query-keys";

interface ClusterHealthOut {
  timestamp?: string;
  health_score?: number;
  nodes_total?: number;
  status_counts?: Record<string, number>;
  current_load?: number;
  total_capacity?: number;
  load_factor?: number;
}

interface ClusterNodeOut {
  node_id: string;
  container_name: string;
  region: string;
  status: string;
  health_score: number;
  peer_count: number;
  max_peers: number;
  is_draining: boolean;
}

interface ClusterNodesOut {
  nodes: ClusterNodeOut[];
  total: number;
}

interface ClusterTopologyOut {
  timestamp: string;
  load_factor: number;
  health_score: number;
  topology_version: number;
  current_load: number;
  total_capacity: number;
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
  } = useApiQuery<AutomationStatusOut>([...automationKeys.status()], "/control-plane/automation/status", {
    retry: 1,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const { data: clusterHealth, refetch: refetchClusterHealth } = useApiQuery<ClusterHealthOut>(
    [...clusterKeys.health()],
    "/cluster/health",
    {
      retry: 1,
      staleTime: 15_000,
      refetchInterval: 15_000,
    }
  );

  const { data: clusterTopology, refetch: refetchClusterTopology } = useApiQuery<ClusterTopologyOut>(
    [...clusterKeys.topology()],
    "/cluster/topology",
    {
      retry: 1,
      staleTime: 15_000,
      refetchInterval: 15_000,
    }
  );

  const { data: clusterNodes, refetch: refetchClusterNodes } = useApiQuery<ClusterNodesOut>(
    [...clusterKeys.nodes()],
    "/cluster/nodes",
    {
      retry: 1,
      staleTime: 15_000,
      refetchInterval: 15_000,
    }
  );

  const refreshAll = useCallback(() => {
    void refetchStatus();
    void refetchClusterHealth();
    void refetchClusterTopology();
    void refetchClusterNodes();
  }, [refetchClusterHealth, refetchClusterNodes, refetchClusterTopology, refetchStatus]);

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

  const setNodeDrainState = useCallback(
    async (nodeId: string, drain: boolean) => {
      setActionPending(true);
      setActionError(null);
      try {
        await api.post(drain ? `/cluster/nodes/${nodeId}/drain` : `/cluster/nodes/${nodeId}/undrain`);
        refreshAll();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Failed to update node drain state");
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

  const nodeRows = useMemo(() => {
    return (clusterNodes?.nodes ?? []).map((node) => ({
      id: node.node_id,
      node: node.node_id,
      container: node.container_name,
      region: node.region || "—",
      status: node.status,
      health: `${Math.round((node.health_score ?? 0) * 100)}%`,
      peers: `${node.peer_count}/${node.max_peers}`,
      draining: node.is_draining ? "Yes" : "No",
      action: (
        <Button
          type="button"
          size="sm"
          variant={node.is_draining ? "default" : "warning"}
          disabled={actionPending}
          onClick={() => void setNodeDrainState(node.node_id, !node.is_draining)}
        >
          {node.is_draining ? "Undrain" : "Drain"}
        </Button>
      ),
    }));
  }, [actionPending, clusterNodes?.nodes, setNodeDrainState]);

  if (isStatusLoading) {
    return <PageLoadingState title="Automation" pageClass="automation-page" dataTestId="automation-page" bodyHeight={220} />;
  }

  if (isStatusError) {
    return (
      <PageErrorState
        title="Automation"
        pageClass="automation-page"
        dataTestId="automation-page"
        message={statusError instanceof Error ? statusError.message : "Failed to load automation status"}
        onRetry={refreshAll}
      />
    );
  }

  return (
    <PageLayout
      title="Automation"
      description="Control-plane automation and cluster operations"
      pageClass="automation-page"
      dataTestId="automation-page"
      actions={
        <Button type="button" variant="default" onClick={refreshAll} disabled={actionPending}>
          Refresh
        </Button>
      }
    >
      <Card>
        <SectionHeader label="Run automation" />
        <PageFilterRow className="automation-page__filters">
          <label className="automation-page__filter">
            <span>Batch size</span>
            <Input type="number" min={1} value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
          </label>
          <label className="automation-page__filter">
            <span>Max executions</span>
            <Input type="number" min={1} value={maxExecutions} onChange={(e) => setMaxExecutions(e.target.value)} />
          </label>
          <PageActionRow className="automation-page__actions">
            <Button type="button" variant="default" disabled={actionPending} onClick={() => void runAutomation(false)}>
              Dry run
            </Button>
            <Button type="button" variant="warning" disabled={actionPending} onClick={() => void runAutomation(true)}>
              Execute
            </Button>
          </PageActionRow>
        </PageFilterRow>
      </Card>

      <Card>
        <SectionHeader label="Cluster status" />
        <PageKeyValueList className="automation-page__dl">
          <dt>Automation enabled</dt>
          <dd>{status?.enabled ? "Yes" : "No"}</dd>
          <dt>Cluster health score</dt>
          <dd>{clusterHealth?.health_score != null ? `${Math.round(clusterHealth.health_score * 100)}%` : "—"}</dd>
          <dt>Nodes</dt>
          <dd>{clusterHealth?.nodes_total ?? "—"}</dd>
          <dt>Load factor</dt>
          <dd>{clusterTopology?.load_factor != null ? clusterTopology.load_factor.toFixed(2) : "—"}</dd>
          <dt>Capacity</dt>
          <dd>{clusterHealth?.current_load ?? "—"}/{clusterHealth?.total_capacity ?? "—"}</dd>
          <dt>Last run</dt>
          <dd>{status?.last_run_at ? new Date(status.last_run_at).toLocaleString() : "Never"}</dd>
        </PageKeyValueList>
      </Card>

      <Card>
        <SectionHeader label="Cluster operations" />
        <PageActionRow className="automation-page__buttons">
          <Button type="button" variant="secondary" disabled={actionPending} onClick={() => void runClusterAction("/cluster/scan")}>Discover nodes</Button>
          <Button type="button" variant="secondary" disabled={actionPending} onClick={() => void runClusterAction("/cluster/resync")}>Resync topology</Button>
        </PageActionRow>
      </Card>

      {actionError && (
        <div className="alert danger" role="alert">
          <span className="alert-icon" aria-hidden />
          <div>
            <div className="alert-title">Action failed</div>
            <div className="alert-desc">{actionError}</div>
          </div>
        </div>
      )}

      <Card>
        <SectionHeader label="Recent run" />
        {latestRun ? (
          <>
            <MetaText>
              Generated at {new Date(latestRun.generated_at).toLocaleString()} · load {latestRun.load_factor.toFixed(2)} · health {latestRun.health_score.toFixed(2)}
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

      <Card>
        <SectionHeader label="Cluster nodes" />
        <div className="data-table-wrap">
          <DataTable
            density="compact"
            columns={[
              { key: "node", header: "Node" },
              { key: "container", header: "Container" },
              { key: "region", header: "Region" },
              { key: "status", header: "Status" },
              { key: "health", header: "Health" },
              { key: "peers", header: "Peers" },
              { key: "draining", header: "Draining" },
              { key: "action", header: "Action" },
            ]}
            rows={nodeRows}
            getRowKey={(row: { id: string }) => row.id}
          />
        </div>
      </Card>
    </PageLayout>
  );
}
