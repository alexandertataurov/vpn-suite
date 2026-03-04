import { useCallback, useMemo, useState } from "react";
import { useApiQuery } from "@/core/api/useApiQuery";
import { useApi } from "@/core/api/context";
import {
  AnimatedNumber,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  KpiValue,
  MetaText,
  SectionTitle,
  Skeleton,
  Widget,
} from "@/design-system";
import type {
  ContainerSummary,
  ContainerSummaryListOut,
  TelemetryServicesOut,
  AlertItemListOut,
  AlertItem,
} from "@/shared/types/admin-api";

interface NodeSummaryOut {
  total: number;
  online: number;
  degraded: number;
  down: number;
}

interface DeviceSummaryOut {
  total: number;
  handshake_ok: number;
  needs_reconcile: number;
  stale: number;
}

interface SessionsSnapshotOut {
  active_sessions: number;
  incidents_count: number;
}

interface SnapshotMetaOut {
  snapshot_ts: number;
  cursor: string;
  freshness: string;
  incidents_count: number;
  stale_node_ids: string[];
  partial_failure: boolean;
}

interface NodesSnapshotOut {
  summary: NodeSummaryOut;
}

interface DevicesSnapshotOut {
  summary: DeviceSummaryOut;
}

interface TelemetrySnapshotOut {
  nodes: NodesSnapshotOut | null;
  devices: DevicesSnapshotOut | null;
  sessions: SessionsSnapshotOut | null;
  meta: SnapshotMetaOut;
}

interface OperatorDashboard {
  health_strip: {
    avg_latency_ms: number | null;
    total_throughput_bps: number;
  };
  servers: Array<{
    id: string;
    name: string;
    region: string;
    cpu_pct: number | null;
    ram_pct: number | null;
    throughput_bps: number;
    status: string;
    freshness: string;
  }>;
  timeseries: Array<{
    ts: number;
    peers: number;
    rx: number;
    tx: number;
  }>;
}

function formatBps(bps: number): string {
  if (bps == null) return "—";
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function avgPct(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function formatRelativeFromSeconds(ts: number): string {
  if (!ts) return "—";
  const ms = ts * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
}

export function TelemetryPage() {
  const api = useApi();
  const [nodeActionPendingId, setNodeActionPendingId] = useState<string | null>(null);
  const [dockerActionPendingId, setDockerActionPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useApiQuery<TelemetrySnapshotOut>(
    ["telemetry", "snapshot"],
    "/telemetry/snapshot?scope=all&fields=meta,nodes.summary,devices.summary,sessions",
    { retry: 1 }
  );

  const { data: operatorData } = useApiQuery<OperatorDashboard>(
    ["overview", "operator", "1h"],
    "/overview/operator?time_range=1h",
    { retry: 1, staleTime: 30_000 }
  );

  const { data: dockerData, refetch: refetchDocker } = useApiQuery<ContainerSummaryListOut>(
    ["telemetry", "docker", "containers"],
    "/telemetry/docker/containers",
    { retry: 1, staleTime: 30_000 }
  );

  const {
    data: servicesData,
    isLoading: isServicesLoading,
    isError: isServicesError,
  } = useApiQuery<TelemetryServicesOut>(
    ["telemetry", "services"],
    "/analytics/telemetry/services",
    { retry: 1, staleTime: 30_000 }
  );

  const {
    data: alertsData,
    isLoading: isAlertsLoading,
    isError: isAlertsError,
  } = useApiQuery<AlertItemListOut>(
    ["telemetry", "docker", "alerts"],
    "/telemetry/docker/alerts",
    { retry: 1, staleTime: 15_000 }
  );

  const handleNodeSync = useCallback(
    async (serverId: string) => {
      setActionError(null);
      setNodeActionPendingId(serverId);
      try {
        await api.post(`/servers/${serverId}/sync`, { mode: "manual" });
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Node sync failed");
      } finally {
        setNodeActionPendingId(null);
      }
    },
    [api]
  );

  const handleDockerAction = useCallback(
    async (containerId: string, action: "start" | "stop" | "restart") => {
      setActionError(null);
      setDockerActionPendingId(containerId);
      const base = `/telemetry/docker/container/${containerId}`;
      const path =
        action === "start"
          ? `${base}/start?host_id=local`
          : action === "stop"
            ? `${base}/stop?host_id=local`
            : `${base}/restart?host_id=local`;
      try {
        await api.post(path);
        void refetchDocker();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Container action failed");
      } finally {
        setDockerActionPendingId(null);
      }
    },
    [api, refetchDocker]
  );

  const dockerByCategory = useMemo(() => {
    const byCat: Record<string, Array<ReturnType<typeof buildDockerRow>>> = {};
    const items: ContainerSummary[] = dockerData?.items ?? [];
    for (const c of items) {
      const row = buildDockerRow(c, dockerActionPendingId, handleDockerAction);
      const category = classifyContainer(c);
      if (!byCat[category]) byCat[category] = [];
      byCat[category].push(row);
    }
    return byCat;
  }, [dockerActionPendingId, dockerData?.items, handleDockerAction]);

  if (isLoading) {
    return (
      <div className="page telemetry-page" data-testid="telemetry-page">
        <Skeleton height={32} width="30%" />
        <Skeleton height={120} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page telemetry-page" data-testid="telemetry-page">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load telemetry"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page telemetry-page" data-testid="telemetry-page">
        <EmptyState message="No telemetry data yet." />
      </div>
    );
  }

  const { meta, nodes, devices, sessions } = data;
  const nodeSummary = nodes?.summary;
  const deviceSummary = devices?.summary;
  const sessionsSummary = sessions;
  const strip = operatorData?.health_strip;
  const servers = operatorData?.servers ?? [];
  const avgCpu = avgPct(servers.map((s) => s.cpu_pct));
  const avgRam = avgPct(servers.map((s) => s.ram_pct));

  const tsPoints = operatorData?.timeseries ?? [];
  let avgThroughputBps: number | null = null;
  let peakThroughputBps: number | null = null;
  let totalBytes: number | null = null;
  if (tsPoints.length >= 2) {
    const first = tsPoints[0]!;
    const lastPoint = tsPoints[tsPoints.length - 1]!;
    const bytesStart = first.rx + first.tx;
    const bytesEnd = lastPoint.rx + lastPoint.tx;
    if (bytesEnd >= bytesStart) {
      totalBytes = bytesEnd - bytesStart;
    }
    let sumBps = 0;
    let intervals = 0;
    for (let i = 1; i < tsPoints.length; i += 1) {
      const prev = tsPoints[i - 1]!;
      const cur = tsPoints[i]!;
      const dt = cur.ts - prev.ts;
      if (dt <= 0) continue;
      const deltaRx = cur.rx - prev.rx;
      const deltaTx = cur.tx - prev.tx;
      const bytes = Math.max(0, deltaRx + deltaTx);
      const bps = bytes / dt;
      sumBps += bps;
      intervals += 1;
      if (peakThroughputBps == null || bps > peakThroughputBps) {
        peakThroughputBps = bps;
      }
    }
    if (intervals > 0) {
      avgThroughputBps = sumBps / intervals;
    }
  }

  const serverRows = servers.map((s) => ({
    name: s.name,
    region: s.region,
    cpu: s.cpu_pct != null ? `${s.cpu_pct}%` : "—",
    ram: s.ram_pct != null ? `${s.ram_pct}%` : "—",
    traffic: formatBytes(s.throughput_bps),
    status: s.status,
    freshness: s.freshness,
    id: s.id,
    actions: (
      <Button
        type="button"
        variant="secondary"
        onClick={() => handleNodeSync(s.id)}
        disabled={nodeActionPendingId === s.id}
      >
        Sync
      </Button>
    ),
  }));

  const serviceRows =
    servicesData?.services.map((s) => ({
      job: s.job,
      instance: s.instance,
      health: s.health === "up" ? "up" : "down",
      last_scrape: s.last_scrape ? new Date(s.last_scrape).toLocaleString() : "—",
      last_error: s.last_error || "—",
    })) ?? [];

  const alertRows =
    alertsData?.items.map((a: AlertItem) => ({
      id: a.id,
      severity: a.severity,
      rule: a.rule,
      host: a.host_id,
      container: a.container_name || a.container_id || "—",
      created_at: new Date(a.created_at).toLocaleString(),
      status: a.status,
      actions:
        a.container_id != null ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleDockerAction(a.container_id!, "restart")}
          >
            Restart container
          </Button>
        ) : (
          "—"
        ),
    })) ?? [];

  return (
    <div className="page telemetry-page" data-testid="telemetry-page">
      <header className="telemetry-page__header">
        <SectionTitle className="telemetry-page__title">Telemetry</SectionTitle>
        <MetaText className="telemetry-page__updated">
          Snapshot {formatRelativeFromSeconds(meta.snapshot_ts)} · Freshness {meta.freshness}
        </MetaText>
      </header>
      <div className="kpi-grid telemetry-page__cards">
        {nodeSummary && (
          <Widget title="Nodes" subtitle="cluster status" variant="kpi" href="/servers">
            <KpiValue as="div" className="kpi__value">
              <AnimatedNumber value={nodeSummary.online} />/<AnimatedNumber value={nodeSummary.total} /> online
            </KpiValue>
            <div className="kpi__meta">
              <span className="kpi__meta-item">{nodeSummary.degraded} degraded</span>
              <span className="kpi__meta-item">{nodeSummary.down} down</span>
            </div>
          </Widget>
        )}
        {deviceSummary && (
          <Widget title="Devices" subtitle="handshake + reconcile" variant="kpi" href="/devices">
            <KpiValue as="div" className="kpi__value">
              <AnimatedNumber value={deviceSummary.handshake_ok} />/<AnimatedNumber value={deviceSummary.total} /> healthy
            </KpiValue>
            <div className="kpi__meta">
              <span className="kpi__meta-item">{deviceSummary.needs_reconcile} need reconcile</span>
              <span className="kpi__meta-item">{deviceSummary.stale} stale</span>
            </div>
          </Widget>
        )}
        {sessionsSummary && (
          <Widget title="Sessions" subtitle="current snapshot" variant="kpi">
            <KpiValue as="div" className="kpi__value">
              <AnimatedNumber value={sessionsSummary.active_sessions} />
            </KpiValue>
            <div className="kpi__meta">
              <span className="kpi__meta-item">{sessionsSummary.incidents_count} incidents</span>
            </div>
          </Widget>
        )}
        {strip && (
          <>
            <Widget title="Latency" subtitle="avg" variant="kpi">
              <KpiValue as="div" className="kpi__value">
                {strip.avg_latency_ms != null ? (
                  <><AnimatedNumber value={strip.avg_latency_ms} decimals={0} /> ms</>
                ) : (
                  "—"
                )}
              </KpiValue>
            </Widget>
            <Widget title="TX/RX" subtitle="current" variant="kpi">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {formatBps(strip.total_throughput_bps ?? 0)}
              </KpiValue>
            </Widget>
            <Widget title="CPU" subtitle="avg" variant="kpi">
              <KpiValue as="div" className="kpi__value">
                {avgCpu != null ? (
                  <><AnimatedNumber value={avgCpu} decimals={1} />%</>
                ) : (
                  "—"
                )}
              </KpiValue>
            </Widget>
            <Widget title="RAM" subtitle="avg" variant="kpi">
              <KpiValue as="div" className="kpi__value">
                {avgRam != null ? (
                  <><AnimatedNumber value={avgRam} decimals={1} />%</>
                ) : (
                  "—"
                )}
              </KpiValue>
            </Widget>
            <Widget title="Avg bandwidth" subtitle="over window" variant="kpi">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {avgThroughputBps != null ? formatBps(avgThroughputBps) : "—"}
              </KpiValue>
            </Widget>
            <Widget title="Peak bandwidth" subtitle="over window" variant="kpi">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {peakThroughputBps != null ? formatBps(peakThroughputBps) : "—"}
              </KpiValue>
            </Widget>
            <Widget title="Data transfer" subtitle="total" variant="kpi">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {totalBytes != null ? formatBytes(totalBytes) : "—"}
              </KpiValue>
            </Widget>
          </>
        )}
      </div>
      {serverRows.length > 0 && (
        <section className="telemetry-page__table" aria-label="Per-node telemetry">
          <h3 className="telemetry-page__section-title">Nodes (CPU, RAM, traffic)</h3>
          <div className="data-table-wrap">
          <DataTable
            columns={[
              { key: "name", header: "Node" },
              { key: "region", header: "Region" },
              { key: "cpu", header: "CPU" },
              { key: "ram", header: "RAM" },
              { key: "traffic", header: "Traffic (RX+TX)" },
              { key: "status", header: "Status" },
              { key: "freshness", header: "Freshness" },
              { key: "actions", header: "Actions" },
            ]}
            rows={serverRows}
            getRowKey={(row: { id: string }) => row.id}
          />
          </div>
        </section>
      )}
      {servicesData && (
        <section className="telemetry-page__table" aria-label="Telemetry services status">
          <h3 className="telemetry-page__section-title">Telemetry services</h3>
          {isServicesLoading && <p className="telemetry-page__subtle">Loading telemetry services…</p>}
          {isServicesError && !isServicesLoading && (
            <p className="telemetry-page__warning" role="status">
              Telemetry services status unavailable.
            </p>
          )}
          {serviceRows.length > 0 && (
            <div className="data-table-wrap">
            <DataTable
              columns={[
                { key: "job", header: "Job" },
                { key: "instance", header: "Instance" },
                { key: "health", header: "Health" },
                { key: "last_scrape", header: "Last scrape" },
                { key: "last_error", header: "Last error" },
              ]}
              rows={serviceRows}
              getRowKey={(row: { job: string; instance: string }) => `${row.job}:${row.instance}`}
            />
            </div>
          )}
          {servicesData.message && (
            <p className="telemetry-page__subtle" role="status">
              {servicesData.message}
            </p>
          )}
        </section>
      )}
      {alertsData && (
        <section className="telemetry-page__table" aria-label="Docker alerts">
          <h3 className="telemetry-page__section-title">Docker alerts</h3>
          {isAlertsLoading && <p className="telemetry-page__subtle">Loading alerts…</p>}
          {isAlertsError && !isAlertsLoading && (
            <p className="telemetry-page__warning" role="status">
              Docker alerts unavailable.
            </p>
          )}
          {alertRows.length > 0 ? (
            <div className="data-table-wrap">
            <DataTable
              columns={[
                { key: "severity", header: "Severity" },
                { key: "rule", header: "Rule" },
                { key: "host", header: "Host" },
                { key: "container", header: "Container" },
                { key: "created_at", header: "Created" },
                { key: "status", header: "Status" },
                { key: "actions", header: "Actions" },
              ]}
              rows={alertRows}
              getRowKey={(row: { id: string }) => row.id}
            />
            </div>
          ) : (
            !isAlertsLoading && <p className="telemetry-page__subtle">No active Docker alerts.</p>
          )}
        </section>
      )}
      {Object.keys(dockerByCategory).length > 0 &&
        Object.entries(dockerByCategory).map(([category, rows]) => (
          <section key={category} className="telemetry-page__table" aria-label={`Docker ${category}`}>
            <h3 className="telemetry-page__section-title">Docker — {category}</h3>
            <div className="data-table-wrap">
            <DataTable
              columns={[
                { key: "service", header: "Service" },
                { key: "container", header: "Container" },
                { key: "image", header: "Image" },
                { key: "state", header: "State" },
                { key: "health", header: "Health" },
                { key: "cpu", header: "CPU" },
                { key: "mem", header: "Mem" },
                { key: "rx", header: "RX" },
                { key: "tx", header: "TX" },
                { key: "errors", header: "Errors (5m)" },
                { key: "actions", header: "Actions" },
              ]}
              rows={rows}
              getRowKey={(row: { id: string }) => row.id}
            />
            </div>
          </section>
        ))}
      {actionError && (
        <p className="telemetry-page__warning" role="alert">
          {actionError}
        </p>
      )}
      {meta.partial_failure && (
        <p className="telemetry-page__warning">
          Telemetry is partially degraded. Some nodes or devices may be missing from this snapshot.
        </p>
      )}
      {meta.stale_node_ids.length > 0 && (
        <p className="telemetry-page__stale">
          Stale nodes: {meta.stale_node_ids.join(", ")}
        </p>
      )}
    </div>
  );
}

function classifyContainer(c: ContainerSummary): string {
  const svc = (c.compose_service || c.name || "").toLowerCase();
  const project = (c.compose_project || "").toLowerCase();
  if (
    svc.includes("prometheus") ||
    svc.includes("grafana") ||
    svc.includes("loki") ||
    svc.includes("tempo") ||
    svc.includes("otel") ||
    svc.includes("victoria") ||
    svc.includes("alertmanager") ||
    svc.includes("cadvisor") ||
    svc.includes("node-exporter") ||
    project.includes("monitor")
  ) {
    return "Monitoring & telemetry";
  }
  if (svc.includes("admin-api") || svc.includes("reverse-proxy") || svc.includes("telegram-vpn-bot")) {
    return "Control-plane services";
  }
  return "Other containers";
}

function buildDockerRow(
  c: ContainerSummary,
  dockerActionPendingId: string | null,
  handleDockerAction: (id: string, action: "start" | "stop" | "restart") => void
) {
  const pending = dockerActionPendingId === c.container_id;
  const service = c.compose_service || c.compose_project || c.name;
  const isRunning = (c.state || "").toLowerCase() === "running";
  return {
    id: c.container_id,
    service,
    container: c.name,
    image: c.image_tag || c.image,
    state: c.state,
    health: c.health_status,
    cpu:
      typeof c.cpu_pct === "number"
        ? `${c.cpu_pct.toFixed(1)}%`
        : "—",
    mem:
      typeof c.mem_pct === "number"
        ? `${c.mem_pct.toFixed(1)}%`
        : "—",
    rx: formatBytes(c.net_rx_bytes ?? null),
    tx: formatBytes(c.net_tx_bytes ?? null),
    errors:
      typeof c.error_rate_5m === "number"
        ? `${c.error_rate_5m.toFixed(2)}%`
        : "—",
    actions: (
      <div className="telemetry-page__docker-actions">
        {isRunning ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleDockerAction(c.container_id, "restart")}
              disabled={pending}
            >
              Restart
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleDockerAction(c.container_id, "stop")}
              disabled={pending}
            >
              Stop
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleDockerAction(c.container_id, "start")}
            disabled={pending}
          >
            Start
          </Button>
        )}
      </div>
    ),
  };
}
