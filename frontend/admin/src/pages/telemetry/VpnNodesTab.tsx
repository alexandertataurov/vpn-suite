import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PrimitiveBadge, Button, Panel, InlineAlert, PageError, Select, Skeleton, Table, RelativeTime, useToast } from "@vpn-suite/shared/ui";
import { serverHealthBadge } from "../../utils/statusBadges";
import { ClusterHealthCharts } from "../../components/telemetry/ClusterHealthCharts";
import { DataSourceHealthStrip } from "../../components/telemetry/DataSourceHealthStrip";
import type {
  OperatorDashboardOut,
  ServerOut,
  ServerTelemetryOut,
  TopologySummaryOut,
} from "@vpn-suite/shared/types";
import { OPERATOR_DASHBOARD_KEY, TELEMETRY_TOPOLOGY_KEY, serverTelemetryKey } from "../../api/query-keys";
import { api } from "../../api/client";
import { shouldRetryQuery } from "../../utils/queryPolicy";
import { useServerListForRegion } from "../../hooks/useServerList";
import { formatBytes, formatDateTime, formatPercent01 } from "@vpn-suite/shared";
import {
  computeFreshnessStatus,
  freshnessStatusToLabel,
  freshnessStatusToVariant,
  getTelemetryErrorMessage,
} from "../../utils/telemetry-freshness";
import { TelemetryKpiGrid } from "../../components/telemetry/TelemetryKpiGrid";
import { LiveDegradedBanner } from "../../components/telemetry/LiveDegradedBanner";
import { useClusterLiveMetrics } from "../../context/LiveMetricsProvider";

interface RegionHealthRow {
  region: string;
  total: number;
  healthy: number;
  unhealthy: number;
  inactive: number;
}

function asPercent(v: number | null | undefined): string {
  if (v == null) return "—";
  return formatPercent01(v, { digits: 1 });
}

function isHealthyStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized === "ok" || normalized === "healthy";
}

export function VpnNodesTab({ regionFilter }: { regionFilter: string }) {
  const queryClient = useQueryClient();
  const addToast = useToast();
  const [activeServerId, setActiveServerId] = useState("");
  const [chartTimeRange, setChartTimeRange] = useState("1h");
  const liveCluster = useClusterLiveMetrics();

  const operatorQuery = useQuery<OperatorDashboardOut>({
    queryKey: [...OPERATOR_DASHBOARD_KEY, chartTimeRange],
    queryFn: ({ signal }) =>
      api.get<OperatorDashboardOut>(`/overview/operator?time_range=${chartTimeRange}`, { signal }),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: shouldRetryQuery,
  });
  const handleRefreshCharts = useCallback(() => {
    queryClient.refetchQueries({ queryKey: OPERATOR_DASHBOARD_KEY });
  }, [queryClient]);

  const refetchWhenVisible = (ms: number) => () => (document.hidden ? false : ms);
  const backoffInterval = (base: number, failures: number) =>
    Math.min(base * Math.pow(2, Math.min(failures, 4)), 60_000);
  const summaryQuery = useQuery<TopologySummaryOut>({
    queryKey: TELEMETRY_TOPOLOGY_KEY,
    queryFn: ({ signal }) => api.get<TopologySummaryOut>("/control-plane/topology/summary", { signal }),
    refetchInterval: (q) => refetchWhenVisible(backoffInterval(5000, (q.state as { failureCount?: number }).failureCount ?? 0))(),
    refetchOnWindowFocus: true,
  });

  const serversQuery = useServerListForRegion(regionFilter, { refetchInterval: 10_000 });

  const visibleServers = useMemo(() => {
    if (!serversQuery.data) return [];
    if (regionFilter === "all") return serversQuery.data.items;
    return serversQuery.data.items.filter((server) => (server.region ?? "") === regionFilter);
  }, [serversQuery.data, regionFilter]);

  const activeServer = useMemo(
    () => visibleServers.find((server) => server.id === activeServerId) ?? null,
    [activeServerId, visibleServers]
  );

  useEffect(() => {
    const hasActive = visibleServers.some((server) => server.id === activeServerId);
    if (!hasActive) {
      setActiveServerId(visibleServers[0]?.id ?? "");
    }
  }, [activeServerId, visibleServers]);

  const serverTelemetryQuery = useQuery<ServerTelemetryOut>({
    queryKey: serverTelemetryKey(activeServerId),
    queryFn: ({ signal }) => api.get<ServerTelemetryOut>(`/servers/${activeServerId}/telemetry`, { signal }),
    refetchInterval: (q) => refetchWhenVisible(backoffInterval(5000, (q.state as { failureCount?: number }).failureCount ?? 0))(),
    refetchOnWindowFocus: true,
    enabled: Boolean(activeServerId),
  });

  const restartNodeMutation = useMutation({
    mutationFn: async () => {
      if (!activeServerId) {
        throw new Error("No server selected");
      }
      await api.post(`/servers/${activeServerId}/actions`, {
        type: "restart_service",
        payload: { origin: "telemetry", reason: "manual_restart" },
      });
    },
    onSuccess: () => {
      if (activeServerId) {
        queryClient.invalidateQueries({ queryKey: serverTelemetryKey(activeServerId) });
      }
      queryClient.invalidateQueries({ queryKey: TELEMETRY_TOPOLOGY_KEY });
      queryClient.invalidateQueries({ queryKey: OPERATOR_DASHBOARD_KEY });
      addToast("Restart requested for node", "success");
    },
    onError: (err: unknown) => {
      addToast(getTelemetryErrorMessage(err), "error");
    },
  });

  const regionRows = useMemo<RegionHealthRow[]>(() => {
    const map = new Map<string, RegionHealthRow>();
    for (const server of visibleServers) {
      const region = server.region ?? "unassigned";
      const row = map.get(region) ?? {
        region,
        total: 0,
        healthy: 0,
        unhealthy: 0,
        inactive: 0,
      };
      row.total += 1;
      if (!server.is_active) row.inactive += 1;
      else if (isHealthyStatus(server.status)) row.healthy += 1;
      else row.unhealthy += 1;
      map.set(region, row);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [visibleServers]);

  const regionColumns = useMemo(
    () => [
      { key: "region", header: "Region", render: (r: RegionHealthRow) => r.region },
      {
        key: "total",
        header: "Nodes total",
        numeric: true,
        align: "right" as const,
        render: (r: RegionHealthRow) => String(r.total),
      },
      {
        key: "healthy",
        header: "Healthy",
        numeric: true,
        align: "right" as const,
        render: (r: RegionHealthRow) => String(r.healthy),
      },
      {
        key: "unhealthy",
        header: "Unhealthy",
        numeric: true,
        align: "right" as const,
        render: (r: RegionHealthRow) => String(r.unhealthy),
      },
      {
        key: "inactive",
        header: "Inactive",
        numeric: true,
        align: "right" as const,
        render: (r: RegionHealthRow) => String(r.inactive),
      },
    ],
    []
  );

  const serversColumns = useMemo(
    () => [
      { key: "id", header: "Node", truncate: true, mono: true, width: 110, render: (r: ServerOut) => r.id.slice(0, 8) },
      { key: "region", header: "Region", truncate: true, width: 130, render: (r: ServerOut) => r.region ?? "—" },
      {
        key: "status",
        header: "Status",
        width: 220,
        render: (r: ServerOut) => {
          const badge = serverHealthBadge(r.status);
          return (
            <span className="vpn-node-status-cell">
              <PrimitiveBadge variant={badge.variant} size="sm">
                {badge.label}
              </PrimitiveBadge>
              {r.last_seen_at ? <span className="table-cell-muted"><RelativeTime date={r.last_seen_at} /></span> : null}
            </span>
          );
        },
      },
      { key: "active", header: "Active", width: 84, render: (r: ServerOut) => (r.is_active ? "Yes" : "No") },
    ],
    []
  );

  if (summaryQuery.error || serversQuery.error) {
    return (
      <PageError
        message="Failed to load VPN node telemetry"
        onRetry={() => {
          summaryQuery.refetch();
          serversQuery.refetch();
        }}
      />
    );
  }

  const serverTelemetry = serverTelemetryQuery.data;
  const lastUpdatedMs = serverTelemetry?.last_updated
    ? new Date(serverTelemetry.last_updated).getTime()
    : null;
  const freshness = computeFreshnessStatus(lastUpdatedMs);

  const apiStatus =
    summaryQuery.error || serversQuery.error
      ? "down"
      : serverTelemetryQuery.error && !serverTelemetry
        ? "down"
        : serverTelemetryQuery.error && serverTelemetry
          ? "degraded"
          : "ok";
  const topologyTs = summaryQuery.data?.timestamp;
  const lastFetchMs =
    (topologyTs ? new Date(topologyTs).getTime() : null) ??
    summaryQuery.dataUpdatedAt ??
    serversQuery.dataUpdatedAt ??
    serverTelemetryQuery.dataUpdatedAt ??
    null;

  return (
    <div className="ref-telemetry-stack">
      <Panel as="section" variant="outline" aria-label="Live cluster health">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Live cluster health</h3>
        </div>
        <LiveDegradedBanner />
        {operatorQuery.error && (
          <InlineAlert
            variant="error"
            title="Failed to load cluster telemetry"
            message={getTelemetryErrorMessage(operatorQuery.error)}
            actions={<Button variant="secondary" size="sm" onClick={() => operatorQuery.refetch()}>Retry</Button>}
            className="mb-3"
          />
        )}
        {operatorQuery.isLoading && !operatorQuery.data ? (
          <Skeleton height={220} />
        ) : (
          <ClusterHealthCharts
            points={operatorQuery.data?.timeseries ?? []}
            timeRange={chartTimeRange}
            onTimeRangeChange={setChartTimeRange}
            onRefresh={handleRefreshCharts}
          />
        )}
      </Panel>
      <DataSourceHealthStrip
        apiStatus={apiStatus}
        lastSuccessfulFetch={lastFetchMs ?? null}
        refreshInterval="5s"
        timeRange="—"
        inferred
        isOffline={typeof navigator !== "undefined" && !navigator.onLine}
      />
      <TelemetryKpiGrid
        items={[
          {
            id: "cluster-load",
            label: "Cluster load",
            value:
              summaryQuery.isLoading || !summaryQuery.data
                ? "…"
                : asPercent(summaryQuery.data.load_factor),
            hint:
              summaryQuery.data
                ? `${summaryQuery.data.current_load ?? 0} / ${summaryQuery.data.total_capacity ?? 0}`
                : undefined,
          },
          {
            id: "node-health",
            label: "Node health",
            value:
              liveCluster
                ? `${liveCluster.summary.online_nodes}/${liveCluster.summary.total_nodes}`
                : summaryQuery.isLoading || !summaryQuery.data
                  ? "…"
                  : `${summaryQuery.data.healthy_nodes}/${summaryQuery.data.nodes_total}`,
            hint: "healthy / total",
          },
          {
            id: "unhealthy-nodes",
            label: "Unhealthy nodes",
            value:
              liveCluster
                ? String(liveCluster.summary.degraded_nodes + liveCluster.summary.down_nodes)
                : summaryQuery.isLoading || !summaryQuery.data
                  ? "…"
                  : String(summaryQuery.data.unhealthy_nodes),
            hint: "requires operator attention",
          },
          {
            id: "stream-freshness",
            label: "Stream",
            value: serverTelemetryQuery.isLoading
              ? "…"
              : freshnessStatusToLabel(freshness),
            hint:
              lastUpdatedMs == null
                ? "No timestamp from source"
                : `${Math.floor((Date.now() - lastUpdatedMs) / 1000)}s ago`,
          },
        ]}
      />

      <Panel as="section" variant="outline" aria-label="Server stream">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Server stream</h3>
          <div className="actions-row flex-wrap">
            <Select
              label="Server node"
              options={visibleServers.map((server) => ({
                value: server.id,
                label: `${server.id.slice(0, 8)} (${server.region ?? "—"})`,
              }))}
              value={activeServerId}
              onChange={setActiveServerId}
              aria-label="Server node"
              className="w-auto"
            />
            <PrimitiveBadge variant={freshnessStatusToVariant(freshness)} title={lastUpdatedMs == null ? "No timestamp provided by data source" : undefined}>
              {freshnessStatusToLabel(freshness)}
            </PrimitiveBadge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => restartNodeMutation.mutate()}
              disabled={
                !activeServerId ||
                restartNodeMutation.isPending ||
                !activeServer ||
                !activeServer.is_active
              }
            >
              Restart node
            </Button>
          </div>
        </div>

        {serverTelemetryQuery.error && !serverTelemetry ? (
          <InlineAlert
            variant="error"
            title="Failed to load server telemetry"
            message={getTelemetryErrorMessage(serverTelemetryQuery.error)}
            actions={<Button variant="secondary" size="sm" onClick={() => serverTelemetryQuery.refetch()}>Retry</Button>}
          />
        ) : serverTelemetryQuery.isLoading ? (
          <Skeleton height={80} />
        ) : (
          <>
            {serverTelemetryQuery.error && serverTelemetry ? (
              <InlineAlert
                variant="warning"
                title="Stale data"
                message="Last fetch failed. Showing last known values."
                actions={<Button variant="secondary" size="sm" onClick={() => serverTelemetryQuery.refetch()}>Retry</Button>}
                className="mb-3"
              />
            ) : null}
          <dl className="telemetry-grid">
            <dt>Peers total</dt>
            <dd>{serverTelemetry?.peers_count ?? "—"}</dd>
            <dt>Peers online</dt>
            <dd>{serverTelemetry?.online_count ?? "—"}</dd>
            <dt>Total RX</dt>
            <dd>{formatBytes(serverTelemetry?.total_rx_bytes)}</dd>
            <dt>Total TX</dt>
            <dd>{formatBytes(serverTelemetry?.total_tx_bytes)}</dd>
            <dt>Source</dt>
            <dd>{serverTelemetry?.source ?? "—"}</dd>
            <dt>Updated</dt>
            <dd>{serverTelemetry?.last_updated ? formatDateTime(serverTelemetry.last_updated) : "—"}</dd>
          </dl>
          </>
        )}
      </Panel>

      <Panel as="section" variant="outline" aria-label="Region health matrix">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Region health matrix</h3>
        </div>
        <p className="ref-settings-text">
          Each row summarizes how many VPN nodes are healthy, unhealthy, or inactive within a region.
        </p>
        {serversQuery.isLoading ? (
          <Skeleton height={140} />
        ) : (
          <Table<RegionHealthRow>
            columns={regionColumns}
            data={regionRows}
            className="telemetry-region-table"
            keyFn={(row) => row.region}
            emptyMessage="No regions to display for the current region scope."
          />
        )}
      </Panel>

      <Panel as="section" variant="outline" aria-label="Server status list">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Server status list</h3>
        </div>
        <p className="ref-settings-text">
          This table lists individual VPN nodes in the selected region. Click a row to view stream details above.
        </p>
        {serversQuery.isLoading ? (
          <Skeleton height={160} />
        ) : (
          <Table<ServerOut>
            columns={serversColumns}
            data={visibleServers}
            className="telemetry-server-table"
            keyFn={(row) => row.id}
            emptyMessage="No VPN nodes match the current region scope."
          />
        )}
      </Panel>
    </div>
  );
}
