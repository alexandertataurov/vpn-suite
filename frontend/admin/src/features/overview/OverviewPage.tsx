import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useApiQuery } from "@/core/api/useApiQuery";
import {
  AnimatedNumber,
  Badge,
  BadgeCount,
  BodyText,
  Button,
  EmptyState,
  ErrorState,
  KpiValue,
  MetaText,
  Modal,
  Skeleton,
  Widget,
} from "@/design-system";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { serverStatusToVariant } from "@/shared/statusMap";
import { OverviewPeersChart, OverviewThroughputChart, type OperatorTimeseriesPoint } from "./OverviewCharts";

interface HealthSnapshot {
  telemetry_last_at: string | null;
  snapshot_last_at: string | null;
  sessions_active: number;
  incidents_count: number;
  metrics_freshness: Record<string, string>;
}

interface OperatorDashboard {
  health_strip: {
    avg_latency_ms: number | null;
    total_throughput_bps: number;
    peers_active: number | null;
    active_sessions?: number;
    error_rate_pct?: number;
    freshness?: string;
  };
  servers: Array<{
    id: string;
    name: string;
    region: string;
    cpu_pct: number | null;
    ram_pct: number | null;
    throughput_bps: number;
    status: string;
  }>;
  timeseries: OperatorTimeseriesPoint[];
  latency_timeseries?: Array<{ ts: number; latency_ms: number }>;
  incidents?: Array<{
    severity: "critical" | "warning" | "info" | string;
    entity: string;
    metric: string;
    value: unknown;
    timestamp: string;
    status: string;
    affected_servers?: number;
    link?: string;
  }>;
}

function formatBps(bps: number): string {
  if (bps == null) return "—";
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

function formatDelta(delta: number | null, opts?: { invert?: boolean; unit?: string }) {
  if (delta == null || !Number.isFinite(delta)) {
    return { dir: "flat" as const, label: "—", valueText: "—" };
  }
  const invert = opts?.invert ?? false;
  const unit = opts?.unit ?? "";
  const effective = invert ? -delta : delta;
  const dir = effective > 0 ? ("up" as const) : effective < 0 ? ("down" as const) : ("flat" as const);
  const abs = Math.abs(delta);
  const valueText =
    unit === "%"
      ? `${abs.toFixed(abs < 1 ? 1 : 0)}%`
      : unit
        ? `${abs.toFixed(abs < 1 ? 1 : 0)} ${unit}`.trim()
        : abs.toFixed(abs < 1 ? 1 : 0);
  const label = dir === "up" ? "Up" : dir === "down" ? "Down" : "Flat";
  return { dir, label, valueText };
}

function DeltaPill(props: { delta: number | null; invert?: boolean; unit?: string; hint?: string }) {
  const d = formatDelta(props.delta, { invert: props.invert, unit: props.unit });
  const variant = d.dir === "up" ? "success" : d.dir === "down" ? "warning" : "neutral";
  return (
    <Badge
      variant={variant}
      size="sm"
      className="overview-delta"
      aria-label={props.hint ? `${props.hint}: ${d.label} ${d.valueText}` : `${d.label} ${d.valueText}`}
      title={props.hint}
    >
      <span className="overview-delta__icon" aria-hidden="true">
        {d.dir === "up" ? <ArrowUpRight size={14} /> : d.dir === "down" ? <ArrowDownRight size={14} /> : <Minus size={14} />}
      </span>
      <span className="overview-delta__value">{d.valueText}</span>
    </Badge>
  );
}

function avgPct(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function useElapsedSince(iso: string | null): string {
  const [label, setLabel] = useState<string>("—");

  useEffect(() => {
    if (!iso) {
      setLabel("—");
      return;
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setLabel("—");
      return;
    }
    const base = d.getTime();
    function update() {
      const sec = Math.max(0, Math.floor((Date.now() - base) / 1000));
      if (sec < 2) {
        setLabel("just now");
      } else if (sec < 60) {
        setLabel(`${sec}s ago`);
      } else {
        const m = Math.floor(sec / 60);
        setLabel(`${m}m ago`);
      }
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [iso]);

  return label;
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

export function OverviewPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState<"Refresh" | "Updating..." | "Updated just now">("Refresh");
  const refreshLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (refreshLabelTimerRef.current) clearTimeout(refreshLabelTimerRef.current);
  }, []);

  const { data, isLoading, isError, error, refetch, isRefetching } = useApiQuery<HealthSnapshot>(
    ["overview", "health-snapshot"],
    "/overview/health-snapshot",
    { retry: 1 }
  );

  const { data: operatorData, refetch: refetchOperator } = useApiQuery<OperatorDashboard>(
    ["overview", "operator", "1h"],
    "/overview/operator?time_range=1h",
    { retry: 1, staleTime: 30_000 }
  );

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const handleRetry = useCallback(() => refetch(), [refetch]);

  const handleRefresh = useCallback(async () => {
    if (refreshLabelTimerRef.current) {
      clearTimeout(refreshLabelTimerRef.current);
      refreshLabelTimerRef.current = null;
    }
    setRefreshLabel("Updating...");
    try {
      await Promise.all([refetch(), refetchOperator()]);
      setRefreshLabel("Updated just now");
      refreshLabelTimerRef.current = setTimeout(() => {
        refreshLabelTimerRef.current = null;
        setRefreshLabel("Refresh");
      }, 2000);
    } catch {
      setRefreshLabel("Refresh");
    }
  }, [refetch, refetchOperator]);

  const strip = operatorData?.health_strip;
  const servers = operatorData?.servers ?? [];
  const timeseries = operatorData?.timeseries ?? [];
  const latencyTs = operatorData?.latency_timeseries ?? [];
  const incidents = operatorData?.incidents ?? [];

  const { topTraffic, topCpu, maxTrafficBps, maxCpuPct } = useMemo(() => {
    const t = [...servers].sort((a, b) => (b.throughput_bps ?? 0) - (a.throughput_bps ?? 0)).slice(0, 5);
    const c = [...servers]
      .filter((s) => s.cpu_pct != null && Number.isFinite(s.cpu_pct))
      .sort((a, b) => (b.cpu_pct ?? 0) - (a.cpu_pct ?? 0))
      .slice(0, 5);
    const maxTraffic = t.length ? t[0]!.throughput_bps ?? 0 : 0;
    const maxCpu = c.length ? c[0]!.cpu_pct ?? 0 : 0;
    return { topTraffic: t, topCpu: c, maxTrafficBps: maxTraffic, maxCpuPct: maxCpu };
  }, [servers]);

  const incidentCounts = useMemo(() => {
    const by: Record<string, number> = {};
    for (const i of incidents) {
      const key = (i.severity || "unknown").toString();
      by[key] = (by[key] ?? 0) + 1;
    }
    return by;
  }, [incidents]);

  const lastAt = data?.telemetry_last_at || data?.snapshot_last_at || null;
  const lastUpdatedLabel = useElapsedSince(lastAt);
  const freshness = data?.metrics_freshness?.telemetry ?? "—";
  const avgCpu = avgPct(servers.map((s) => s.cpu_pct));
  const avgRam = avgPct(servers.map((s) => s.ram_pct));

  if (isLoading) {
    return (
      <div className="page overview-page overview-page--loading" data-testid="dashboard-page">
        <Skeleton height={32} width="40%" className="overview-page__title-skeleton" />
        <Skeleton height={120} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page overview-page" data-testid="dashboard-page">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load overview"}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page overview-page" data-testid="dashboard-page">
        <EmptyState message="No overview data yet." />
      </div>
    );
  }

  const peersNowFromSeries = timeseries.length ? timeseries[timeseries.length - 1]!.peers : null;
  const peersThen = timeseries.length ? timeseries[0]!.peers : null;
  const peersDelta = peersNowFromSeries != null && peersThen != null ? peersNowFromSeries - peersThen : null;
  const peersCurrent = strip?.peers_active ?? peersNowFromSeries;

  const latencyNow = latencyTs.length ? latencyTs[latencyTs.length - 1]!.latency_ms : null;
  const latencyThen = latencyTs.length ? latencyTs[0]!.latency_ms : null;
  const latencyDelta = latencyNow != null && latencyThen != null ? latencyNow - latencyThen : null;

  return (
    <div className="page overview-page" data-testid="dashboard-page">
      <div className="ph">
        <div>
          <div className="ph-title">Overview</div>
          <div className="ph-meta">
            <div className="dot" />
            <span>Last updated {lastUpdatedLabel}</span>
            <span className="sep">·</span>
            <span>
              Sessions:{" "}
              {strip?.active_sessions ?? data.sessions_active}
            </span>
          </div>
        </div>
        <div className="ph-actions">
          <Button
            variant="default"
            onClick={handleRefresh}
            disabled={isRefetching}
            data-testid="dashboard-refresh"
            aria-label={refreshLabel}
            className="act"
          >
            {refreshLabel}
          </Button>
          <Button
            variant="default"
            onClick={openSettings}
            data-testid="dashboard-settings"
            aria-label="Dashboard settings"
            className="act"
          >
            Settings
          </Button>
        </div>
      </div>
      <section className="overview-page__kpis" aria-label="Key metrics">
        <div className="shead">
          <div className="shead-label">System Status</div>
          <div className="shead-line" />
        </div>
        <div className="kpi-row">
        <Widget
          variant="kpi"
          className="overview-kpi edge eb"
          title="Sessions"
          subtitle="vs start of window"
          href="/servers"
          headerRight={
            <DeltaPill
              delta={peersDelta}
              hint="Change in peers (last point vs first point)"
            />
          }
        >
          <KpiValue size="xl" as="div" className="overview-kpi__value">
            <AnimatedNumber value={strip?.active_sessions ?? data.sessions_active} />
          </KpiValue>
          <div className="overview-kpi__meta chips">
              <span className="chip cn">Peers: {peersCurrent ?? "—"}</span>
          </div>
        </Widget>

        <Widget
          variant="kpi"
          className="overview-kpi edge ea"
          title="Incidents"
          subtitle="live signals"
          href="/servers"
          headerRight={
            <BadgeCount
              variant={incidents.length > 0 ? "danger" : "neutral"}
              aria-label="Incident count"
            >
              {incidents.length}
            </BadgeCount>
          }
        >
          <div className="inc-grid" aria-label="Incident summary">
            <div className="inc-cell">
              <div className="ic-lbl">Critical</div>
              <div className="ic-val z">{incidentCounts.critical ?? 0}</div>
            </div>
            <div className="inc-cell">
              <div className="ic-lbl">Warning</div>
              <div className="ic-val z">{incidentCounts.warning ?? 0}</div>
            </div>
            <div className="inc-cell" style={{ gridColumn: "span 2" }}>
              <div className="ic-lbl">Unhealthy nodes</div>
              <div className="ic-val w">{data.incidents_count}</div>
            </div>
          </div>
          {incidents.length === 0 && (
            <MetaText as="p" className="overview-kpi__empty">
              No active incidents reported.
            </MetaText>
          )}
        </Widget>

        <Widget
          variant="kpi"
          className="overview-kpi edge eg"
          title="Telemetry"
          subtitle="freshness"
          href="/telemetry"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 2 }}>
            <div
              className="ring pulse"
              style={{ color: "var(--green)", width: 7, height: 7 }}
            />
            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--green)",
              }}
            >
              {freshness || "Fresh"}
            </span>
          </div>
          <div className="chips">
            <span className="chip cg">
              Last sample: {formatRelative(lastAt)}
            </span>
          </div>
          <div className="spark">
            <svg viewBox="0 0 200 26" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sg-telemetry" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#32b05a" stopOpacity=".28" />
                  <stop offset="100%" stopColor="#32b05a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 18 C25 16 35 5 60 7 C85 9 95 3 120 5 C145 7 155 11 175 9 C185 8 192 7 200 8 L200 26 L0 26 Z"
                fill="url(#sg-telemetry)"
                className="cf"
              />
              <path
                d="M0 18 C25 16 35 5 60 7 C85 9 95 3 120 5 C145 7 155 11 175 9 C185 8 192 7 200 8"
                fill="none"
                stroke="var(--green)"
                strokeWidth={1.2}
                className="cl cl-3"
              />
            </svg>
          </div>
        </Widget>

        <Widget
          variant="kpi"
          className="overview-kpi edge ev"
          title="API latency"
          subtitle="p95 · vs start of window"
          href="/telemetry"
          headerRight={
            <DeltaPill
              delta={latencyDelta}
              unit="ms"
              invert
              hint="Lower latency is better"
            />
          }
        >
          <KpiValue size="xl" as="div" className="overview-kpi__value">
            {latencyNow != null ? (
              <><AnimatedNumber value={latencyNow} /> ms</>
            ) : strip?.avg_latency_ms != null ? (
              <><AnimatedNumber value={strip.avg_latency_ms} /> ms</>
            ) : (
              "—"
            )}
          </KpiValue>
          <div className="overview-kpi__meta">
            <span className="overview-kpi__meta-item">Error rate: {strip?.error_rate_pct != null ? `${strip.error_rate_pct}%` : "—"}</span>
          </div>
        </Widget>

        <Widget
          variant="kpi"
          className="overview-kpi edge et"
          title="Cluster load"
          subtitle="CPU/RAM (avg)"
          href="/telemetry"
        >
          <div className="overview-kpi__meta">
            <span className="overview-kpi__meta-item">CPU: {avgCpu != null ? `${avgCpu}%` : "—"}</span>
            <span className="overview-kpi__meta-item">RAM: {avgRam != null ? `${avgRam}%` : "—"}</span>
            <span className="overview-kpi__meta-item">
              Bandwidth now: {strip ? formatBps(strip.total_throughput_bps ?? 0) : "—"}
            </span>
          </div>
        </Widget>
        </div>
      </section>

      <section aria-label="Live metrics">
        <div className="shead" style={{ marginTop: 16 }}>
          <div className="shead-label">Live Metrics</div>
          <div className="shead-line" />
          <div className="shead-note">Last 1 hour</div>
        </div>
        <div className="chart-row">
        <Widget
          title="Peers"
          subtitle="Last 1 hour"
          href="/telemetry"
          className="edge eb cc"
        >
          {timeseries.length > 1 ? (
            <OverviewPeersChart points={timeseries} currentPeers={strip?.peers_active ?? null} />
          ) : (
            <EmptyState message="No peers timeseries yet." />
          )}
        </Widget>

        <Widget
          title="Bandwidth"
          subtitle="Last 1 hour (RX+TX)"
          href="/telemetry"
          className="edge ev cc"
        >
          {timeseries.length > 2 ? (
            <OverviewThroughputChart points={timeseries} />
          ) : (
            <EmptyState message="No bandwidth timeseries yet." />
          )}
        </Widget>

        <Widget title="Top nodes" subtitle="By traffic" href="/servers" className="cc">
          {topTraffic.length > 0 ? (
            <div className="nlist" aria-label="Top nodes by traffic">
              {topTraffic.map((s, idx) => {
                const rank = idx + 1;
                const value = s.throughput_bps ?? 0;
                const max = maxTrafficBps || 0;
                const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
                const statusVariant = serverStatusToVariant(s.status);
                const statusClass =
                  statusVariant === "danger"
                    ? "off"
                    : statusVariant === "warning"
                      ? "warn"
                      : "ok";
                return (
                  <div key={s.id} className="ni">
                    <span className="nrank">{rank}</span>
                    <span className={`nst ${statusClass}`} />
                    <span className="nname">
                      {s.name}
                      {s.region && (
                        <span className="overview-widget__list-region"> · {s.region}</span>
                      )}
                    </span>
                    <span className="nval">
                      {formatBps(value)}
                    </span>
                    <div className="nbar">
                      <div className="nbfill" style={{ width: `${pct}%`, background: "var(--chart-blue)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No node traffic yet." />
          )}
        </Widget>

        <Widget title="Hot nodes" subtitle="By CPU" href="/servers" className="cc">
          {topCpu.length > 0 ? (
            <div className="nlist" aria-label="Top nodes by CPU">
              {topCpu.map((s, idx) => {
                const rank = idx + 1;
                const value = s.cpu_pct ?? 0;
                const max = maxCpuPct || 0;
                const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
                const statusVariant = serverStatusToVariant(s.status);
                const statusClass =
                  statusVariant === "danger"
                    ? "off"
                    : statusVariant === "warning"
                      ? "warn"
                      : "ok";
                const valueClass =
                  value >= 85 ? "nval wc" : value >= 60 ? "nval" : "nval";
                return (
                  <div key={s.id} className="ni">
                    <span className="nrank">{rank}</span>
                    <span className={`nst ${statusClass}`} />
                    <span className="nname">
                      {s.name}
                      {s.region && (
                        <span className="overview-widget__list-region"> · {s.region}</span>
                      )}
                    </span>
                    <span className={valueClass}>
                      {s.cpu_pct != null ? `${s.cpu_pct}%` : "—"}
                    </span>
                    <div className="nbar">
                      <div
                        className="nbfill"
                        style={{
                          width: `${pct}%`,
                          background:
                            value >= 85
                              ? "var(--red)"
                              : value >= 60
                                ? "var(--amber)"
                                : "var(--chart-blue)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No CPU telemetry yet." />
          )}
        </Widget>
        </div>
      </section>

      <Modal
        open={settingsOpen}
        onClose={closeSettings}
        title="Dashboard settings"
        data-testid="dashboard-settings-modal"
      >
        <BodyText className="overview-page__settings-text">
          Density, theme, and other preferences (placeholder).
        </BodyText>
      </Modal>
    </div>
  );
}
