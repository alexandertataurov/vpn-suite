import { useCallback, useMemo, useState } from "react";
import { useApiQuery } from "@/core/api/useApiQuery";
import { useApi } from "@/core/api/context";
import {
  AnimatedNumber,
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  SectionHeader,
  Skeleton,
  Widget,
} from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { KpiValue, KpiValueUnit } from "@/design-system/typography";
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

  const monitoringContainers = dockerByCategory["Monitoring & telemetry"] ?? [];
  const controlPlaneContainers = dockerByCategory["Control-plane services"] ?? [];
  const otherContainers = dockerByCategory["Other containers"] ?? [];

  if (isLoading) {
    return (
      <PageLayout title="Telemetry" pageClass="telemetry-page" dataTestId="telemetry-page" hideHeader>
        <Skeleton height={32} width="30%" />
        <Skeleton height={120} />
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Telemetry" pageClass="telemetry-page" dataTestId="telemetry-page" hideHeader>
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load telemetry"}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout title="Telemetry" pageClass="telemetry-page" dataTestId="telemetry-page" hideHeader>
        <EmptyState message="No telemetry data yet." />
      </PageLayout>
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
    name: <span className="cell-primary">{s.name}</span>,
    region: <span className="cell-muted">{s.region}</span>,
    cpu: (
      <span className="cell-num">
        {s.cpu_pct != null ? `${s.cpu_pct}%` : "—"}
      </span>
    ),
    ram: (
      <span className="cell-num">
        {s.ram_pct != null ? `${s.ram_pct}%` : "—"}
      </span>
    ),
    traffic: <span className="cell-num">{formatBytes(s.throughput_bps)}</span>,
    status: (
      <Badge size="sm" variant={statusToVariant(s.status)}>
        {s.status}
      </Badge>
    ),
    freshness: <span className="cell-muted">{s.freshness}</span>,
    id: s.id,
    actions: (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => handleNodeSync(s.id)}
        disabled={nodeActionPendingId === s.id}
      >
        Sync
      </Button>
    ),
  }));

  const serviceRows =
    servicesData?.services.map((s) => ({
      id: `${s.job}:${s.instance}`,
      service: <span className="cell-primary">{s.job}</span>,
      endpoint: (
        <span className="cell-url cell-mono">
          {s.instance}
        </span>
      ),
      status: (
        <Badge size="sm" variant={s.health === "up" ? "success" : "danger"}>
          {s.health ?? "unknown"}
        </Badge>
      ),
      lastScore: s.last_scrape ? new Date(s.last_scrape).toLocaleString() : "—",
      lastError: s.last_error || "—",
    })) ?? [];

  const alertRows =
    alertsData?.items.map((a: AlertItem) => {
      const sev = (a.severity || "info").toLowerCase();
      const sevVariant =
        sev === "critical" || sev === "error"
          ? "danger"
          : sev === "warning"
            ? "warning"
            : "info";
      const containerLabel = `${a.host_id ?? "local"} · ${a.container_name || a.container_id || "—"}`;
      return {
        id: a.id,
        rule: a.rule,
        severity: (
          <Badge size="sm" variant={sevVariant}>
            {a.severity}
          </Badge>
        ),
        container: <span className="cell-muted">{containerLabel}</span>,
        created_at: new Date(a.created_at).toLocaleString(),
        actions:
          a.container_id != null ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDockerAction(a.container_id!, "restart")}
            >
              Restart
            </Button>
          ) : (
            "—"
          ),
      };
    }) ?? [];

  const telemetryDescription = (
    <span className="telemetry-page__updated">
      Snapshot {formatRelativeFromSeconds(meta.snapshot_ts)} · Freshness {meta.freshness} ·{" "}
      {meta.incidents_count} incidents · {meta.stale_node_ids.length} stale nodes
      {meta.partial_failure ? " · partial failure" : ""}
    </span>
  );

  return (
    <PageLayout
      title="Telemetry"
      description={telemetryDescription}
      pageClass="telemetry-page"
      dataTestId="telemetry-page"
    >
      <SectionHeader label="Summary" size="lg" note={`Snapshot ${formatRelativeFromSeconds(meta.snapshot_ts)}`} />
      <div className="kpi-grid telemetry-page__cards">
        {nodeSummary && (
          <Widget title="Nodes" subtitle="cluster status" variant="kpi" href="/servers" size="medium">
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
          <Widget title="Devices" subtitle="handshake + reconcile" variant="kpi" href="/devices" size="medium">
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
          <Widget title="Sessions" subtitle="current snapshot" variant="kpi" size="medium">
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
            <Widget title="Latency" subtitle="avg" variant="kpi" size="medium">
              <KpiValueUnit
                value={
                  strip.avg_latency_ms != null ? (
                    <AnimatedNumber value={strip.avg_latency_ms} decimals={0} />
                  ) : (
                    "—"
                  )
                }
                unit={strip.avg_latency_ms != null ? "ms" : ""}
              />
            </Widget>
            <Widget title="TX/RX" subtitle="current" variant="kpi" size="medium">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {formatBps(strip.total_throughput_bps ?? 0)}
              </KpiValue>
            </Widget>
            <Widget title="CPU" subtitle="avg" variant="kpi" size="medium">
              <KpiValue as="div" className="kpi__value">
                {avgCpu != null ? (
                  <><AnimatedNumber value={avgCpu} decimals={1} />%</>
                ) : (
                  "—"
                )}
              </KpiValue>
            </Widget>
            <Widget title="RAM" subtitle="avg" variant="kpi" size="medium">
              <KpiValue as="div" className="kpi__value">
                {avgRam != null ? (
                  <><AnimatedNumber value={avgRam} decimals={1} />%</>
                ) : (
                  "—"
                )}
              </KpiValue>
            </Widget>
            <Widget title="Avg bandwidth" subtitle="over window" variant="kpi" size="medium">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {avgThroughputBps != null ? formatBps(avgThroughputBps) : "—"}
              </KpiValue>
            </Widget>
            <Widget title="Peak bandwidth" subtitle="over window" variant="kpi" size="medium">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {peakThroughputBps != null ? formatBps(peakThroughputBps) : "—"}
              </KpiValue>
            </Widget>
            <Widget title="Data transfer" subtitle="total" variant="kpi" size="medium">
              <KpiValue as="div" className="kpi__value kpi__value--small">
                {totalBytes != null ? formatBytes(totalBytes) : "—"}
              </KpiValue>
            </Widget>
          </>
        )}
      </div>
      {serverRows.length > 0 && (
        <section className="telemetry-page__table" aria-label="Per-node telemetry">
          <SectionHeader label="Nodes (CPU, RAM, traffic)" size="lg" />
          <div className="data-table-wrap">
          <DataTable
            density="compact"
            columns={[
              { key: "name", header: "Name" },
              { key: "region", header: "Region" },
              { key: "cpu", header: "CPU" },
              { key: "ram", header: "RAM" },
              { key: "traffic", header: "Throughput (RX+TX)" },
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
          <SectionHeader label="Telemetry services" size="lg" />
          {isServicesLoading && <p className="telemetry-page__subtle">Loading telemetry services…</p>}
          {isServicesError && !isServicesLoading && (
            <p className="telemetry-page__warning" role="status">
              Telemetry services status unavailable.
            </p>
          )}
          {serviceRows.length > 0 && (
            <div className="data-table-wrap">
              <DataTable
                density="compact"
                columns={[
                  { key: "service", header: "Service" },
                  { key: "endpoint", header: "Endpoint" },
                  { key: "status", header: "Status" },
                  { key: "lastScore", header: "Last score" },
                  { key: "lastError", header: "Last error" },
                ]}
                rows={serviceRows}
                getRowKey={(row: { id: string }) => row.id}
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
      {(alertsData || otherContainers.length > 0) && (
        <section
          className="telemetry-page__table telemetry-page__docker-grid"
          aria-label="Docker alerts and containers"
        >
          <div className="telemetry-page__docker-column">
            {alertsData && (
              <>
                <h3 className="telemetry-page__section-title">Docker — Alerts</h3>
                {isAlertsLoading && <p className="telemetry-page__subtle">Loading alerts…</p>}
                {isAlertsError && !isAlertsLoading && (
                  <p className="telemetry-page__warning" role="status">
                    Docker alerts unavailable.
                  </p>
                )}
                {alertRows.length > 0 ? (
                  <div className="data-table-wrap">
                    <DataTable
                      density="compact"
                      columns={[
                        { key: "rule", header: "Alert" },
                        { key: "severity", header: "Severity" },
                        { key: "container", header: "Container" },
                        { key: "created_at", header: "Time" },
                        { key: "actions", header: "Action" },
                      ]}
                      rows={alertRows}
                      getRowKey={(row: { id: string }) => row.id}
                    />
                  </div>
                ) : (
                  !isAlertsLoading && <p className="telemetry-page__subtle">No active Docker alerts.</p>
                )}
              </>
            )}
          </div>
          <div className="telemetry-page__docker-column">
            {otherContainers.length > 0 && (
              <>
                <h3 className="telemetry-page__section-title">Docker — Other containers</h3>
                <div className="data-table-wrap">
                  <DataTable
                    density="compact"
                    columns={[
                      { key: "service", header: "Name" },
                      { key: "image", header: "Image" },
                      { key: "state", header: "Status" },
                      { key: "health", header: "Health" },
                    ]}
                    rows={otherContainers}
                    getRowKey={(row: { id: string }) => row.id}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      )}
      {controlPlaneContainers.length > 0 && (
        <section
          className="telemetry-page__table"
          aria-label="Docker control plane services"
        >
          <h3 className="telemetry-page__section-title">Docker — Control Plane Services</h3>
          <div className="data-table-wrap">
            <DataTable
              density="compact"
              columns={[
                { key: "service", header: "Container" },
                { key: "ports", header: "Ports" },
                { key: "image", header: "Image" },
                { key: "state", header: "State" },
                { key: "health", header: "Health" },
                { key: "cpu", header: "CPU" },
                { key: "mem", header: "RAM" },
                { key: "actions", header: "Actions" },
              ]}
              rows={controlPlaneContainers}
              getRowKey={(row: { id: string }) => row.id}
            />
          </div>
        </section>
      )}
      {monitoringContainers.length > 0 && (
        <section
          className="telemetry-page__table"
          aria-label="Docker monitoring and telemetry"
        >
          <h3 className="telemetry-page__section-title">Docker — Monitoring &amp; Telemetry</h3>
          <div className="data-table-wrap">
            <DataTable
              density="compact"
              columns={[
                { key: "service", header: "Container" },
                { key: "ports", header: "Ports" },
                { key: "image", header: "Image" },
                { key: "state", header: "State" },
                { key: "health", header: "Health" },
                { key: "cpu", header: "CPU" },
                { key: "mem", header: "RAM" },
                { key: "actions", header: "Actions" },
              ]}
              rows={monitoringContainers}
              getRowKey={(row: { id: string }) => row.id}
            />
          </div>
        </section>
      )}
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
    </PageLayout>
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
  const ports = formatPorts(c.ports);
  return {
    id: c.container_id,
    service,
    container: c.name,
    image: c.image_tag || c.image,
    ports,
    state: c.state,
    health: (
      <Badge size="sm" variant={healthToVariant(c.health_status)}>
        {c.health_status}
      </Badge>
    ),
    cpu: (
      <span className="cell-num">
        {typeof c.cpu_pct === "number" ? `${c.cpu_pct.toFixed(1)}%` : "—"}
      </span>
    ),
    mem: (
      <span className="cell-num">
        {typeof c.mem_pct === "number" ? `${c.mem_pct.toFixed(1)}%` : "—"}
      </span>
    ),
    rx: (
      <span className="cell-num">
        {formatBytes(c.net_rx_bytes ?? null)}
      </span>
    ),
    tx: (
      <span className="cell-num">
        {formatBytes(c.net_tx_bytes ?? null)}
      </span>
    ),
    errors: (
      <span className="cell-num">
        {typeof c.error_rate_5m === "number"
          ? `${c.error_rate_5m.toFixed(2)}%`
          : "—"}
      </span>
    ),
    actions: (
      <div className="telemetry-page__docker-actions">
        {isRunning ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleDockerAction(c.container_id, "restart")}
              disabled={pending}
            >
              Restart
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
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
            size="sm"
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

function statusToVariant(
  status: string | null | undefined
): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  if (!status) return "neutral";
  const value = status.toLowerCase();
  if (value === "online" || value === "up" || value === "running") {
    return "success";
  }
  if (value === "warning" || value === "warn" || value === "degraded") {
    return "warning";
  }
  if (
    value === "down" ||
    value === "error" ||
    value === "critical" ||
    value === "offline"
  ) {
    return "danger";
  }
  return "info";
}

function healthToVariant(
  health: ContainerSummary["health_status"]
): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  const value = (health || "").toLowerCase();
  if (value === "healthy") return "success";
  if (value === "starting") return "info";
  if (value === "unhealthy") return "danger";
  if (value === "none") return "neutral";
  return "info";
}

function formatPorts(ports: ContainerSummary["ports"]): string {
  if (!ports || ports.length === 0) return "—";
  const mapped = ports.map((p) => {
    const pub = p.public_port ?? p.private_port;
    return `${pub}/${p.protocol}`;
  });
  const display = mapped.slice(0, 3).join(", ");
  return mapped.length > 3 ? `${display}, …` : display;
}
