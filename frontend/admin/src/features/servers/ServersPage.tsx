import { useCallback, useState } from "react";
import { useApiQuery } from "@/core/api/useApiQuery";
import { useApi } from "@/core/api/context";
import {
  AnimatedNumber,
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  MetaText,
  Modal,
  SectionTitle,
  Skeleton,
  Widget,
} from "@/design-system";
import type { ServerList, ServerOut, ServerSyncResponse } from "@/shared/types/admin-api";

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

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
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

  const { data, isLoading, isError, error, refetch } = useApiQuery<ServersSnapshotSummaryOut>(
    ["servers", "snapshots", "summary"],
    "/servers/snapshots/summary",
    { retry: 1 }
  );

  if (isLoading) {
    return (
      <div className="page servers-page" data-testid="servers-page">
        <Skeleton height={32} width="30%" />
        <Skeleton height={200} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page servers-page" data-testid="servers-page">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load servers"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data || Object.keys(data.servers).length === 0) {
    return (
      <div className="page servers-page" data-testid="servers-page">
        <SectionTitle>Servers</SectionTitle>
        <div className="table-empty" data-testid="servers-table">
          <EmptyState message="No servers ready yet. Once telemetry snapshots are available, they will appear here." />
        </div>
      </div>
    );
  }

  const entries = Object.entries(data.servers);

  const totalServers = entries.length;
  const cpuValues = entries.map(([, e]) => e.cpu_pct).filter((v): v is number => v != null);
  const ramValues = entries.map(([, e]) => e.ram_pct).filter((v): v is number => v != null);
  const avgCpu = cpuValues.length ? cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length : null;
  const avgRam = ramValues.length ? ramValues.reduce((a, b) => a + b, 0) / ramValues.length : null;

  let totalActivePeers = 0;
  let totalPeers = 0;
  let usedIps = 0;
  let totalIps = 0;
  for (const [, e] of entries) {
    totalActivePeers += e.active_peers ?? 0;
    totalPeers += e.total_peers ?? 0;
    usedIps += e.used_ips ?? 0;
    totalIps += e.total_ips ?? 0;
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

  return (
    <div className="page servers-page" data-testid="servers-page">
      <SectionTitle>Servers</SectionTitle>
      <div className="servers-page__summary">
        <Widget title="Tracked servers" subtitle="snapshot inventory" variant="kpi" href="/servers">
          <div className="kpi__value">
            <AnimatedNumber value={rows.length} />
          </div>
        </Widget>
        <Widget title="Avg CPU" subtitle="across reporting servers" variant="kpi" href="/telemetry">
          <div className="kpi__value">
            {avgCpu == null ? "—" : <><AnimatedNumber value={avgCpu} decimals={1} />%</>}
          </div>
        </Widget>
        <Widget title="Avg RAM" subtitle="across reporting servers" variant="kpi" href="/telemetry">
          <div className="kpi__value">
            {avgRam == null ? "—" : <><AnimatedNumber value={avgRam} decimals={1} />%</>}
          </div>
        </Widget>
        <Widget title="Peers" subtitle="active / total" variant="kpi" href="/telemetry">
          <div className="kpi__value">
            {totalPeers === 0 ? "—" : <><AnimatedNumber value={totalActivePeers} />/<AnimatedNumber value={totalPeers} /></>}
          </div>
        </Widget>
        <Widget title="IP capacity" subtitle="used / total" variant="kpi" href="/servers">
          <div className="kpi__value">
            {totalIps === 0 ? "—" : <><AnimatedNumber value={usedIps} />/<AnimatedNumber value={totalIps} /></>}
          </div>
        </Widget>
      </div>
      <div className="servers-page__controls">
        <Input
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
      <div data-testid="servers-table" className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Server ID</th>
              <th>CPU</th>
              <th>RAM</th>
              <th>Peers (active/total)</th>
              <th>IPs (used/total)</th>
              <th>Health</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowClass =
                row.statusVariant === "neutral" ? "" : `row-${row.statusVariant}`;
              const badgeVariant =
                row.statusVariant === "neutral" ? "neutral" : row.statusVariant;
              return (
                <tr key={row.serverId} className={rowClass}>
                  <td>
                    <span className="cell-primary">{row.serverId}</span>
                  </td>
                  <td>{row.cpu}</td>
                  <td>{row.ram}</td>
                  <td>{row.peers}</td>
                  <td>{row.ips}</td>
                  <td>
                    <Badge variant={badgeVariant} size="sm">
                      {row.health}
                    </Badge>
                  </td>
                  <td>
                    <span className="cell-muted">{row.source}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ServersSettingsPanel />
    </div>
  );
}

function ServersSettingsPanel() {
  const api = useApi();
  const [selectedServer, setSelectedServer] = useState<ServerOut | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [syncResult, setSyncResult] = useState<ServerSyncResponse | null>(null);

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
  } = useApiQuery<ServerList>(["servers", "settings", "list"], "/servers?limit=50&offset=0", {
    retry: 1,
    staleTime: 15_000,
  });

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

  const handleSync = useCallback(() => {
    if (!selectedServer) return;
    runAction(async () => {
      const res = await api.post<ServerSyncResponse>(`/servers/${selectedServer.id}/sync`, {
        mode: "manual",
      });
      setSyncResult(res);
    });
  }, [api, runAction, selectedServer]);

  const handleDelete = useCallback(() => {
    if (!selectedServer) return;
    // Hard delete; backend protects via 409 when devices reference server.
    runAction(async () => {
      await api.request(`/servers/${selectedServer.id}`, { method: "DELETE" });
      setSelectedServer(null);
    });
  }, [api, runAction, selectedServer]);

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
        <h3 className="servers-page__settings-title">Server settings</h3>
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
      <Button type="button" variant="secondary" onClick={() => handleOpen(s)}>
        Manage
      </Button>
    ),
  }));

  return (
    <div className="servers-page__settings">
      <div className="servers-page__settings-header">
        <h3 className="servers-page__settings-title">Server settings</h3>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Add server
        </Button>
      </div>
      <div className="data-table-wrap">
      <DataTable
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
              <dt>Tags</dt>
              <dd>{selectedServer.tags?.length ? selectedServer.tags.join(", ") : "—"}</dd>
              <dt>Cert expires</dt>
              <dd>{formatRelative(selectedServer.cert_expires_at ?? null)}</dd>
            </dl>

            <h4 className="servers-page__section-title">Ops</h4>
            <div className="servers-page__ops-grid">
              <label className="servers-page__filter servers-page__filter--full">
                Ops notes
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
                Auto sync
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
                Sync interval (sec)
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
              <div className="servers-page__filter-actions servers-page__filter-actions--full">
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleToggleActive}>
                  {selectedServer.is_active ? "Disable" : "Enable"}
                </Button>
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleSaveNotesAndSync}>
                  Save settings
                </Button>
                <Button type="button" variant="secondary" disabled={actionPending} onClick={handleSync}>
                  Sync now
                </Button>
                <Button type="button" variant="danger" disabled={actionPending} onClick={handleDelete}>
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
            ID (optional)
            <Input
              value={createForm.id}
              onChange={(e) => setCreateForm((s) => ({ ...s, id: e.target.value }))}
              placeholder="server id"
            />
          </label>
          <label className="servers-page__filter">
            Name
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="amnezia-awg"
            />
          </label>
          <label className="servers-page__filter">
            Region
            <Input
              value={createForm.region}
              onChange={(e) => setCreateForm((s) => ({ ...s, region: e.target.value }))}
              placeholder="eu-west"
            />
          </label>
          <label className="servers-page__filter">
            API endpoint
            <Input
              value={createForm.api_endpoint}
              onChange={(e) => setCreateForm((s) => ({ ...s, api_endpoint: e.target.value }))}
              placeholder="http://vpn-node-1:51820"
            />
          </label>
          <label className="servers-page__filter servers-page__filter--full">
            VPN endpoint (host:port, optional)
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
    </div>
  );
}
