import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApi } from "@/core/api/context";
import { serverKeys } from "@/features/servers/services/server.query-keys";
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  Widget,
} from "@/design-system/primitives";
import {
  ClusterLoadWidget,
  IncidentsWidget,
  ServersSummaryWidget,
} from "@/design-system/widgets";
import { VpnNodeDrilldown, VpnNodeGrid } from "@/design-system/widgets/vpn-node";
import { PageLayout } from "@/layout/PageLayout";
import { MetaText } from "@/design-system/typography";
import type {
  OperatorServerRow,
  ServerList,
  ServerOut,
  ServerSyncResponse,
} from "@/shared/types/admin-api";
import type { VpnNodeCard as VpnNodeCardType } from "@/features/vpn-nodes/types";
import { formatRelative } from "@/shared/utils/format";

/** Operator dashboard slice: servers + incidents (cluster metrics from servers). */
interface OperatorDashboard {
  servers: OperatorServerRow[];
  incidents?: Array<{
    severity: string;
    entity: string;
    metric: string;
    value: unknown;
    timestamp: string;
    status: string;
    affected_servers?: number;
    link?: string;
  }>;
}

interface ServerSnapshotSummaryEntry {
  cpu_pct: number | null;
  ram_pct: number | null;
  ram_used_bytes: number | null;
  ram_total_bytes: number | null;
  active_peers: number | null;
  total_peers: number | null;
  used_ips: number | null;
  total_ips: number | null;
  free_ips: number | null;
  health_score: number | null;
  last_snapshot_at: string | null;
  source: string;
}

interface ServersSnapshotSummaryOut {
  servers: Record<string, ServerSnapshotSummaryEntry>;
}

interface ServerLimitsOut {
  traffic_limit_gb: number | null;
  speed_limit_mbps: number | null;
  max_connections: number | null;
}

function formatBps(bps: number): string {
  if (bps == null) return "—";
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function formatPercent(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${Math.round(v)}%`;
}

function formatRatio(numerator: number | null | undefined, denominator: number | null | undefined): string {
  if (denominator == null) return "—";
  const num = numerator ?? 0;
  return `${num}/${denominator}`;
}

export function ServersPage() {
  const [serverFilter, setServerFilter] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useApiQuery<ServersSnapshotSummaryOut>(
    [...serverKeys.snapshotsSummary()],
    "/servers/snapshots/summary",
    { retry: 1 }
  );

  const { data: operatorData, refetch: refetchOperator } = useApiQuery<OperatorDashboard>(
    ["overview", "operator", "1h"],
    "/overview/operator?time_range=1h",
    { retry: 1, staleTime: 30_000 }
  );

  const { data: vpnNodeCards, isLoading: vpnNodesLoading } = useApiQuery<VpnNodeCardType[]>(
    [...serverKeys.vpnNodes()],
    "/servers/vpn-nodes",
    { retry: 1, staleTime: 30_000 }
  );

  const operatorServers = useMemo(() => operatorData?.servers ?? [], [operatorData?.servers]);
  const incidents = useMemo(() => operatorData?.incidents ?? [], [operatorData?.incidents]);
  const incidentCounts = useMemo(() => {
    const by: Record<string, number> = {};
    for (const i of incidents) {
      const key = (i.severity || "unknown").toString();
      by[key] = (by[key] ?? 0) + 1;
    }
    return by;
  }, [incidents]);

  const vpnNodeRegions = useMemo(() => {
    if (!vpnNodeCards?.length) return [];
    const set = new Set<string>();
    vpnNodeCards.forEach((c) => {
      if (c.identity.region) set.add(c.identity.region);
    });
    return Array.from(set).sort();
  }, [vpnNodeCards]);

  const clusterMetrics = useMemo(() => {
    const cpuVals = operatorServers.map((s) => s.cpu_pct).filter((v): v is number => v != null && Number.isFinite(v));
    const ramVals = operatorServers.map((s) => s.ram_pct).filter((v): v is number => v != null && Number.isFinite(v));
    const avgCpu = cpuVals.length ? Math.round((cpuVals.reduce((a, b) => a + b, 0) / cpuVals.length) * 10) / 10 : null;
    const avgRam = ramVals.length ? Math.round((ramVals.reduce((a, b) => a + b, 0) / ramVals.length) * 10) / 10 : null;
    const totalThroughput = operatorServers.reduce((sum, s) => sum + (s.throughput_bps ?? 0), 0);
    return [
      { key: "CPU", value: avgCpu != null ? `${avgCpu}%` : "—", percent: avgCpu ?? undefined },
      { key: "RAM", value: avgRam != null ? `${avgRam}%` : "—", percent: avgRam ?? undefined },
      { key: "Bandwidth", value: formatBps(totalThroughput) },
    ];
  }, [operatorServers]);

  const incidentsData = useMemo(
    () => ({
      critical: incidentCounts.critical ?? 0,
      warning: incidentCounts.warning ?? 0,
      unhealthyNodes: (incidentCounts.critical ?? 0) + (incidentCounts.warning ?? 0),
    }),
    [incidentCounts]
  );

  const entries = useMemo(() => {
    if (!data || Object.keys(data.servers).length === 0) return [];
    return Object.entries(data.servers);
  }, [data]);

  const { totalServers, totalActivePeers, totalPeers, usedIps, totalIps } = useMemo(() => {
    let active = 0;
    let total = 0;
    let u = 0;
    let ti = 0;
    for (const [, e] of entries) {
      active += e.active_peers ?? 0;
      total += e.total_peers ?? 0;
      u += e.used_ips ?? 0;
      ti += e.total_ips ?? 0;
    }
    return {
      totalServers: entries.length,
      totalActivePeers: active,
      totalPeers: total,
      usedIps: u,
      totalIps: ti,
    };
  }, [entries]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchOperator()]);
  }, [refetch, refetchOperator]);

  const handleSelectVpnNode = useCallback((nodeId: string) => setSelectedNodeId(nodeId), []);
  const handleCloseVpnDrilldown = useCallback(() => setSelectedNodeId(null), []);

  if (isLoading) {
    return (
      <PageLayout title="Servers" pageClass="servers-page" dataTestId="servers-page" hideHeader>
        <Skeleton height={32} width="30%" />
        <Skeleton height={200} />
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Servers" pageClass="servers-page" dataTestId="servers-page" hideHeader>
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load servers"}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  if (!data || Object.keys(data.servers).length === 0) {
    return (
      <PageLayout title="Servers" pageClass="servers-page" dataTestId="servers-page">
        <div className="table-empty" data-testid="servers-table">
          <EmptyState message="No servers ready yet. Once telemetry snapshots are available, they will appear here." />
        </div>
      </PageLayout>
    );
  }

  const rows = (() => {
    const allRows = entries.map(([serverId, entry]) => {
      const healthScore = entry.health_score;
      let statusVariant: "success" | "warning" | "danger" | "neutral" = "neutral";
      if (healthScore != null) {
        if (healthScore >= 80) statusVariant = "success";
        else if (healthScore >= 50) statusVariant = "warning";
        else statusVariant = "danger";
      }
      return {
        id: serverId,
        serverId,
        cpu: formatPercent(entry.cpu_pct),
        ram: formatPercent(entry.ram_pct),
        peers: formatRatio(entry.active_peers, entry.total_peers),
        ips: formatRatio(entry.used_ips, entry.total_ips),
        health: healthScore == null ? "—" : `${Math.round(healthScore)}%`,
        source: entry.source,
        statusVariant,
      };
    });
    const q = serverFilter.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => r.serverId.toLowerCase().includes(q));
  })();

  const tableRows = rows.map((row) => ({
    id: row.id,
    serverId: <span className="cell-identifier">{row.serverId}</span>,
    health: (
      <Badge variant={row.statusVariant === "neutral" ? "neutral" : row.statusVariant} size="sm">
        {row.health}
      </Badge>
    ),
    cpu: row.cpu,
    ram: row.ram,
    peers: row.peers,
    ips: row.ips,
    source: <span className="cell-muted">{row.source}</span>,
    statusVariant: row.statusVariant,
  }));

  return (
    <PageLayout
      title="Servers"
      pageClass="servers-page"
      dataTestId="servers-page"
      description={
        <>
          <span className="dot" />
          <span>{totalServers} servers</span>
          <span className="sep">·</span>
          <span>Peers {totalActivePeers}/{totalPeers}</span>
        </>
      }
      actions={
        <Button type="button" variant="default" onClick={() => void handleRefresh()} aria-label="Refresh">
          Refresh
        </Button>
      }
    >
      {(incidentCounts.critical ?? 0) > 0 && (
        <div className="alert danger" role="alert" aria-live="assertive">
          <span className="alert-icon" aria-hidden>✕</span>
          <div>
            <div className="alert-title">Critical incidents</div>
            <div className="alert-desc">
              {incidentCounts.critical} critical {incidentCounts.critical === 1 ? "incident" : "incidents"} reported.
              Check servers and telemetry.
            </div>
          </div>
        </div>
      )}
      <section className="servers-page__widgets" aria-label="Servers widgets">
        <SectionHeader label="Servers" size="lg" note="Last 1h" />
        <div className="servers-page__widgets-row">
          <ServersSummaryWidget
            data={{
              totalServers,
              totalActivePeers,
              totalPeers,
              usedIps,
              totalIps,
            }}
            href="/servers/nodes"
            title="Servers"
            subtitle="count · peers · IPs"
            className="edge et"
          />
          <IncidentsWidget
            data={incidentsData}
            href="/servers"
            title="Incidents"
            subtitle="live signals"
            className="edge ea"
          />
          <ClusterLoadWidget
            data={{ mode: "grid", metrics: clusterMetrics }}
            href="/telemetry"
            title="Cluster load"
            subtitle="CPU/RAM (avg)"
            className="edge eg"
          />
          <Widget
            title="Egress cost estimator"
            subtitle="Placeholder"
            size="medium"
            className="edge eb cc"
          >
            <p className="servers-page__muted type-meta">
              Coming soon. Estimate egress cost from traffic and provider rates.
            </p>
          </Widget>
        </div>
      </section>
      <section
        className="servers-page__vpn-nodes"
        aria-label="VPN nodes"
        data-testid="servers-page-vpn-nodes"
      >
        <SectionHeader label="VPN nodes" size="lg" note="Operator grid · Last 1h" />
        {vpnNodesLoading ? (
          <Skeleton height={200} />
        ) : (
          <VpnNodeGrid
            cards={vpnNodeCards ?? []}
            regions={vpnNodeRegions}
            onSelectNode={handleSelectVpnNode}
            showSectionHeader={false}
          />
        )}
      </section>
      <VpnNodeDrilldown
        nodeId={selectedNodeId}
        open={selectedNodeId != null}
        onClose={handleCloseVpnDrilldown}
      />
      <div className="servers-page__controls">
        <Input
          size="sm"
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value)}
          placeholder="Filter by server ID"
        />
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          Refresh
        </Button>
        <MetaText className="servers-page__controls-meta">
          Showing {rows.length} of {totalServers} servers
        </MetaText>
      </div>
      <SectionHeader label="Servers" size="lg" />
      <div data-testid="servers-table" className="data-table-wrap">
        <DataTable
          density="compact"
          columns={[
            { key: "serverId", header: "Server ID" },
            { key: "health", header: "Health" },
            { key: "cpu", header: "CPU" },
            { key: "ram", header: "RAM" },
            { key: "peers", header: "Peers (active/total)" },
            { key: "ips", header: "IPs (used/total)" },
            { key: "source", header: "Source" },
          ]}
          rows={tableRows}
          getRowKey={(row) => row.id}
          getRowClassName={(row) =>
            row.statusVariant === "neutral" ? undefined : `row-${row.statusVariant}`
          }
        />
      </div>
      <ServersSettingsPanel operatorServers={operatorServers} />
    </PageLayout>
  );
}

function ServersSettingsPanel({
  operatorServers = [],
}: {
  /** From /overview/operator; used for per-node RTT/loss in server detail. */
  operatorServers?: OperatorServerRow[];
}) {
  const api = useApi();
  const [selectedServer, setSelectedServer] = useState<ServerOut | null>(null);
  const [serverToDelete, setServerToDelete] = useState<ServerOut | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [syncResult, setSyncResult] = useState<ServerSyncResponse | null>(null);
  const [limitsForm, setLimitsForm] = useState({
    traffic_limit_gb: "",
    speed_limit_mbps: "",
    max_connections: "",
  });

  const [createForm, setCreateForm] = useState({
    id: "",
    name: "",
    region: "",
    api_endpoint: "",
    vpn_endpoint: "",
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useApiQuery<ServerList>(
    [...serverKeys.settingsList("/servers?limit=50&offset=0")],
    "/servers?limit=50&offset=0",
    {
    retry: 1,
    staleTime: 15_000,
    }
  );

  const {
    data: serverLimits,
    isLoading: isServerLimitsLoading,
    refetch: refetchServerLimits,
  } = useApiQuery<ServerLimitsOut>(
    [...serverKeys.detail(selectedServer?.id ?? ""), "limits"],
    `/servers/${selectedServer?.id ?? ""}/limits`,
    { enabled: !!selectedServer, retry: 1, staleTime: 5_000 }
  );

  useEffect(() => {
    if (!serverLimits) return;
    setLimitsForm({
      traffic_limit_gb:
        serverLimits.traffic_limit_gb == null ? "" : String(serverLimits.traffic_limit_gb),
      speed_limit_mbps:
        serverLimits.speed_limit_mbps == null ? "" : String(serverLimits.speed_limit_mbps),
      max_connections:
        serverLimits.max_connections == null ? "" : String(serverLimits.max_connections),
    });
  }, [serverLimits]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionError(null);
      setActionPending(true);
      try {
        await fn();
        void refetch();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Server action failed");
      } finally {
        setActionPending(false);
      }
    },
    [refetch]
  );

  const handleOpen = useCallback(
    (s: ServerOut) => {
      setSelectedServer(s);
      setSyncResult(null);
      setActionError(null);
    },
    []
  );

  const handleClose = useCallback(() => {
    setSelectedServer(null);
    setSyncResult(null);
    setActionError(null);
  }, []);

  const handleToggleActive = useCallback(() => {
    if (!selectedServer) return;
    const next = !selectedServer.is_active;
    runAction(async () => {
      const updated = await api.patch<ServerOut>(`/servers/${selectedServer.id}`, {
        is_active: next,
      });
      setSelectedServer(updated);
    });
  }, [api, runAction, selectedServer]);

  const handleSaveNotesAndSync = useCallback(() => {
    if (!selectedServer) return;
    runAction(async () => {
      const updated = await api.patch<ServerOut>(`/servers/${selectedServer.id}`, {
        ops_notes: selectedServer.ops_notes ?? null,
        auto_sync_enabled: selectedServer.auto_sync_enabled ?? false,
      });
      setSelectedServer(updated);
    });
  }, [api, runAction, selectedServer]);

  const handleSaveLimits = useCallback(() => {
    if (!selectedServer) return;
    runAction(async () => {
      await api.patch<ServerLimitsOut>(`/servers/${selectedServer.id}/limits`, {
        traffic_limit_gb: limitsForm.traffic_limit_gb.trim()
          ? Number(limitsForm.traffic_limit_gb)
          : null,
        speed_limit_mbps: limitsForm.speed_limit_mbps.trim()
          ? Number(limitsForm.speed_limit_mbps)
          : null,
        max_connections: limitsForm.max_connections.trim()
          ? Number(limitsForm.max_connections)
          : null,
      });
      void refetchServerLimits();
    });
  }, [api, limitsForm.max_connections, limitsForm.speed_limit_mbps, limitsForm.traffic_limit_gb, refetchServerLimits, runAction, selectedServer]);

  const handleToggleDraining = useCallback(() => {
    if (!selectedServer) return;
    runAction(async () => {
      if (selectedServer.is_draining) {
        await api.post(`/cluster/nodes/${selectedServer.id}/undrain`);
      } else {
        await api.post(`/cluster/nodes/${selectedServer.id}/drain`);
      }
      const updated = await api.get<ServerOut>(`/servers/${selectedServer.id}`);
      setSelectedServer(updated);
    });
  }, [api, runAction, selectedServer]);

  const handleSync = useCallback(() => {
    if (!selectedServer) return;
    runAction(async () => {
      const res = await api.post<ServerSyncResponse>(`/servers/${selectedServer.id}/sync`, {
        mode: "manual",
      });
      setSyncResult(res);
    });
  }, [api, runAction, selectedServer]);

  const handleDeleteClick = useCallback(() => {
    if (!selectedServer) return;
    setServerToDelete(selectedServer);
    setDeleteConfirmText("");
  }, [selectedServer]);

  const handleDeleteSubmit = useCallback(() => {
    if (!serverToDelete) return;
    runAction(async () => {
      await api.request(`/servers/${serverToDelete.id}`, { method: "DELETE" });
      setSelectedServer(null);
      setServerToDelete(null);
      setDeleteConfirmText("");
    });
  }, [api, runAction, serverToDelete]);

  const handleCreateSubmit = useCallback(() => {
    const body: Record<string, unknown> = {
      name: createForm.name.trim(),
      region: createForm.region.trim(),
      api_endpoint: createForm.api_endpoint.trim(),
    };
    if (!body.name || !body.region || !body.api_endpoint) {
      setActionError("Name, region, and API endpoint are required.");
      return;
    }
    if (createForm.id.trim()) body.id = createForm.id.trim();
    if (createForm.vpn_endpoint.trim()) body.vpn_endpoint = createForm.vpn_endpoint.trim();
    runAction(async () => {
      await api.post<ServerOut>("/servers", body);
      setIsCreateOpen(false);
      setCreateForm({
        id: "",
        name: "",
        region: "",
        api_endpoint: "",
        vpn_endpoint: "",
      });
    });
  }, [api, createForm, runAction]);

  if (isLoading) {
    return (
      <div className="servers-page__settings">
        <Skeleton height={24} width="40%" />
        <Skeleton height={120} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="servers-page__settings">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load server settings"}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="servers-page__settings">
        <SectionHeader label="Server settings" size="sm" />
        <EmptyState message="No servers defined yet. Use Add server to register a node." />
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Add server
        </Button>
      </div>
    );
  }

  const rows = data.items.map((s) => ({
    id: s.id,
    name: s.name || s.id,
    region: s.region ?? "—",
    status: s.status,
    active: s.is_active ? "yes" : "no",
    last_seen: formatRelative(s.last_seen_at ?? null),
    provider: s.provider ?? "—",
    actions: (
      <Button type="button" variant="secondary" size="sm" onClick={() => handleOpen(s)}>
        Manage
      </Button>
    ),
  }));

  return (
    <div className="servers-page__settings">
      <div className="servers-page__settings-header">
        <SectionHeader label="Server settings" size="lg">
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            Add server
          </Button>
        </SectionHeader>
      </div>
      <div className="data-table-wrap">
      <DataTable
        density="compact"
        columns={[
          { key: "name", header: "Name" },
          { key: "region", header: "Region" },
          { key: "status", header: "Status" },
          { key: "active", header: "Active" },
          { key: "last_seen", header: "Last seen" },
          { key: "provider", header: "Provider" },
          { key: "actions", header: "Actions" },
        ]}
        rows={rows}
        getRowKey={(row: { id: string }) => row.id}
      />
      </div>

      <Modal
        open={!!selectedServer}
        onClose={handleClose}
        title={selectedServer ? `Server: ${selectedServer.name || selectedServer.id}` : "Server"}
      >
        {selectedServer && (
          <div className="servers-page__detail">
            {actionError && (
              <p className="servers-page__detail-error" role="alert">
                {actionError}
              </p>
            )}
            <dl className="servers-page__detail-dl">
              <dt>ID</dt>
              <dd>{selectedServer.id}</dd>
              <dt>Name</dt>
              <dd>{selectedServer.name || "—"}</dd>
              <dt>Region</dt>
              <dd>{selectedServer.region ?? "—"}</dd>
              <dt>Status</dt>
              <dd>{selectedServer.status}</dd>
              <dt>Active</dt>
              <dd>{selectedServer.is_active ? "yes" : "no"}</dd>
              <dt>API endpoint</dt>
              <dd>{selectedServer.api_endpoint}</dd>
              <dt>VPN endpoint</dt>
              <dd>{selectedServer.vpn_endpoint ?? "—"}</dd>
              <dt>Last seen</dt>
              <dd>{formatRelative(selectedServer.last_seen_at ?? null)}</dd>
              <dt>Last snapshot</dt>
              <dd>{formatRelative(selectedServer.last_snapshot_at ?? null)}</dd>
              <dt>Provider</dt>
              <dd>{selectedServer.provider ?? "—"}</dd>
              <dt>Draining</dt>
              <dd>{selectedServer.is_draining ? "yes" : "no"}</dd>
              <dt>Tags</dt>
              <dd>{selectedServer.tags?.length ? selectedServer.tags.join(", ") : "—"}</dd>
              <dt>Cert expires</dt>
              <dd>{formatRelative(selectedServer.cert_expires_at ?? null)}</dd>
            </dl>

            <SectionHeader label="RTT / Loss" size="sm" />
            <div className="servers-page__detail-rtt">
              {(() => {
                const opRow = operatorServers.find((r) => r.id === selectedServer.id);
                const rtt = opRow?.rtt_ms ?? null;
                const loss = opRow?.packet_loss_pct ?? null;
                return (
                  <>
                    <p className="servers-page__muted">
                      {rtt != null || loss != null ? (
                        <>Current: {rtt != null ? `${Math.round(rtt)} ms` : "—"} RTT
                          {loss != null ? `, ${loss.toFixed(1)}% loss` : ""}</>
                      ) : (
                        "No current RTT/loss from agent."
                      )}
                    </p>
                    <p className="servers-page__muted type-meta">
                      Per-node RTT/loss timeseries will appear when Prometheus or the aggregator stores them.
                    </p>
                  </>
                );
              })()}
            </div>

            <SectionHeader label="Ops" size="sm" />
            <div className="servers-page__ops-grid">
              <label className="servers-page__filter servers-page__filter--full">
                <span className="servers-page__label">Ops notes</span>
                <textarea
                  className="input servers-page__textarea"
                  value={selectedServer.ops_notes ?? ""}
                  onChange={(e) =>
                    setSelectedServer({
                      ...selectedServer,
                      ops_notes: e.target.value,
                    })
                  }
                  rows={4}
                />
              </label>
              <label className="servers-page__filter">
                <span className="servers-page__label">Auto sync</span>
                <select
                  className="input"
                  value={selectedServer.auto_sync_enabled ? "on" : "off"}
                  onChange={(e) =>
                    setSelectedServer({
                      ...selectedServer,
                      auto_sync_enabled: e.target.value === "on",
                    })
                  }
                >
                  <option value="off">Disabled</option>
                  <option value="on">Enabled</option>
                </select>
              </label>
              <label className="servers-page__filter">
                <span className="servers-page__label">Sync interval (sec)</span>
                <Input
                  type="number"
                  value={selectedServer.auto_sync_interval_sec ?? 60}
                  onChange={(e) =>
                    setSelectedServer({
                      ...selectedServer,
                      auto_sync_interval_sec: Number(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="servers-page__filter">
                <span className="servers-page__label">Traffic limit (GB)</span>
                <Input
                  type="number"
                  value={limitsForm.traffic_limit_gb}
                  onChange={(e) =>
                    setLimitsForm((prev) => ({ ...prev, traffic_limit_gb: e.target.value }))
                  }
                  placeholder={isServerLimitsLoading ? "Loading..." : "No limit"}
                />
              </label>
              <label className="servers-page__filter">
                <span className="servers-page__label">Speed limit (Mbps)</span>
                <Input
                  type="number"
                  value={limitsForm.speed_limit_mbps}
                  onChange={(e) =>
                    setLimitsForm((prev) => ({ ...prev, speed_limit_mbps: e.target.value }))
                  }
                  placeholder={isServerLimitsLoading ? "Loading..." : "No limit"}
                />
              </label>
              <label className="servers-page__filter">
                <span className="servers-page__label">Max connections</span>
                <Input
                  type="number"
                  value={limitsForm.max_connections}
                  onChange={(e) =>
                    setLimitsForm((prev) => ({ ...prev, max_connections: e.target.value }))
                  }
                  placeholder={isServerLimitsLoading ? "Loading..." : "No limit"}
                />
              </label>
              <div className="servers-page__filter-actions servers-page__filter-actions--full">
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleToggleActive}>
                  {selectedServer.is_active ? "Disable" : "Enable"}
                </Button>
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleToggleDraining}>
                  {selectedServer.is_draining ? "Undrain node" : "Drain node"}
                </Button>
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleSaveNotesAndSync}>
                  Save settings
                </Button>
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleSaveLimits}>
                  Save limits
                </Button>
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleSync}>
                  Sync now
                </Button>
                <Button type="button" variant="danger" disabled={actionPending} onClick={handleDeleteClick}>
                  Delete server
                </Button>
              </div>
              {syncResult && (
                <p className="servers-page__muted">
                  Sync requested (request_id {syncResult.request_id}, job {syncResult.job_id})
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setActionError(null);
        }}
        title="Add server"
      >
        {actionError && (
          <p className="servers-page__detail-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="servers-page__create-grid">
          <label className="servers-page__filter">
            <span className="servers-page__label">ID (optional)</span>
            <Input
              value={createForm.id}
              onChange={(e) => setCreateForm((s) => ({ ...s, id: e.target.value }))}
              placeholder="server id"
            />
          </label>
          <label className="servers-page__filter">
            <span className="servers-page__label">Name</span>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="amnezia-awg"
            />
          </label>
          <label className="servers-page__filter">
            <span className="servers-page__label">Region</span>
            <Input
              value={createForm.region}
              onChange={(e) => setCreateForm((s) => ({ ...s, region: e.target.value }))}
              placeholder="eu-west"
            />
          </label>
          <label className="servers-page__filter">
            <span className="servers-page__label">API endpoint</span>
            <Input
              value={createForm.api_endpoint}
              onChange={(e) => setCreateForm((s) => ({ ...s, api_endpoint: e.target.value }))}
              placeholder="http://vpn-node-1:51820"
            />
          </label>
          <label className="servers-page__filter servers-page__filter--full">
            <span className="servers-page__label">VPN endpoint (host:port, optional)</span>
            <Input
              value={createForm.vpn_endpoint}
              onChange={(e) => setCreateForm((s) => ({ ...s, vpn_endpoint: e.target.value }))}
              placeholder="vpn.example.com:47604"
            />
          </label>
        </div>
        <div className="servers-page__modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIsCreateOpen(false);
              setActionError(null);
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleCreateSubmit} disabled={actionPending}>
            Create
          </Button>
        </div>
      </Modal>

      <Modal
        open={serverToDelete != null}
        onClose={() => {
          setServerToDelete(null);
          setDeleteConfirmText("");
        }}
        title="Delete server"
        variant="danger"
      >
        <p className="servers-page__muted">
          This permanently removes the server from the dashboard. Type <strong>DELETE</strong> to confirm.
        </p>
        <label className="servers-page__filter">
          Confirm
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm server deletion"
          />
        </label>
        <div className="servers-page__modal-actions">
          <Button
            type="button"
            variant="default"
            onClick={() => {
              setServerToDelete(null);
              setDeleteConfirmText("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || actionPending}
            onClick={handleDeleteSubmit}
          >
            Delete server
          </Button>
        </div>
      </Modal>
    </div>
  );
}
