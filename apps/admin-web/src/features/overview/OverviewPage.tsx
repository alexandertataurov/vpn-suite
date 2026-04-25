import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { Button, Drawer, EmptyState, ErrorState, SectionHeader, Skeleton, useToast, Widget, Nbar } from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { MetaText } from "@/design-system/typography";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  ApiLatencyWidget,
  ClusterLoadWidget,
  IncidentsWidget,
  SessionsWidget,
  TelemetryWidget,
} from "@/design-system/widgets";
import type { ClusterMetricRow, FreshnessState, SparkPoint } from "@/design-system/widgets/widgets.types";
import { serverStatusToVariant } from "@vpn-suite/shared";
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

type OverviewDensity = "comfortable" | "compact";
type OverviewEmphasis = "balanced" | "operational";
type OverviewAutoRefresh = "off" | "30" | "60";

interface OverviewPreferences {
  density: OverviewDensity;
  emphasis: OverviewEmphasis;
  autoRefresh: OverviewAutoRefresh;
}

const DEFAULT_OVERVIEW_PREFERENCES: OverviewPreferences = {
  density: "comfortable",
  emphasis: "balanced",
  autoRefresh: "off",
};

function getServerStatusVisual(status: string) {
  const statusVariant = serverStatusToVariant(status);
  const statusLabel =
    statusVariant === "danger"
      ? "offline"
      : statusVariant === "warning"
        ? "warning"
        : "healthy";
  const statusClass =
    statusVariant === "danger"
      ? "off"
      : statusVariant === "warning"
        ? "warn"
        : "ok";
  return { statusClass, statusLabel };
}

function formatBps(bps: number): string {
  if (bps == null) return "—";
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
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

function telemetryStateFromLastAt(lastAt: string | null): FreshnessState {
  if (!lastAt) return "dead";
  const ageMs = Date.now() - new Date(lastAt).getTime();
  if (ageMs < 120_000) return "fresh";
  if (ageMs < 600_000) return "stale";
  return "dead";
}

function lastSampleLabelFromLastAt(lastAt: string | null): string {
  if (!lastAt) return "—";
  const r = formatRelative(lastAt);
  if (r === "just now") return "JUST NOW";
  return r.toUpperCase().replace(/\s+/g, " ");
}

function timeseriesToSparkPoints(
  points: OperatorTimeseriesPoint[],
  getY: (p: OperatorTimeseriesPoint) => number
): SparkPoint[] {
  if (!points.length) return [];
  return points.map((p, i) => ({ x: i, y: getY(p) }));
}

export function OverviewPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useLocalStorage<OverviewPreferences>(
    "admin-web:overview-preferences",
    DEFAULT_OVERVIEW_PREFERENCES
  );
  const [refreshLabel, setRefreshLabel] = useState<"Refresh" | "Updating..." | "Updated just now">("Refresh");
  const refreshLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

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
      toast.showToast({ variant: "success", title: "Updated", description: "Dashboard data refreshed." });
      refreshLabelTimerRef.current = setTimeout(() => {
        refreshLabelTimerRef.current = null;
        setRefreshLabel("Refresh");
      }, 2000);
    } catch {
      setRefreshLabel("Refresh");
    }
  }, [refetch, refetchOperator, toast]);

  useEffect(() => {
    if (preferences.autoRefresh === "off") return;
    const id = setInterval(() => {
      void Promise.all([refetch(), refetchOperator()]);
    }, Number(preferences.autoRefresh) * 1000);
    return () => clearInterval(id);
  }, [preferences.autoRefresh, refetch, refetchOperator]);

  const updatePreferences = useCallback(
    (patch: Partial<OverviewPreferences>) => {
      setPreferences({ ...preferences, ...patch });
    },
    [preferences, setPreferences]
  );

  const strip = operatorData?.health_strip;
  const servers = useMemo(
    () => operatorData?.servers ?? [],
    [operatorData?.servers]
  );
  const timeseries = operatorData?.timeseries ?? [];
  const latencyTs = operatorData?.latency_timeseries ?? [];
  const incidents = useMemo(
    () => operatorData?.incidents ?? [],
    [operatorData?.incidents]
  );

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
  const avgCpu = avgPct(servers.map((s) => s.cpu_pct));
  const avgRam = avgPct(servers.map((s) => s.ram_pct));

  if (isLoading) {
    return (
      <PageLayout
        title="Overview"
        pageClass="overview-page overview-page--loading"
        dataTestId="dashboard-page"
        hideHeader
      >
        <Skeleton height={32} width="40%" className="overview-page__title-skeleton" />
        <Skeleton height={120} />
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Overview" pageClass="overview-page" dataTestId="dashboard-page" hideHeader>
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load overview"}
          onRetry={handleRetry}
        />
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout title="Overview" pageClass="overview-page" dataTestId="dashboard-page" hideHeader>
        <EmptyState message="No overview data yet." />
      </PageLayout>
    );
  }

  const peersNowFromSeries = timeseries.length ? timeseries[timeseries.length - 1]!.peers : null;
  const peersThen = timeseries.length ? timeseries[0]!.peers : null;
  const peersCurrent = peersNowFromSeries ?? strip?.peers_active ?? data.sessions_active ?? null;

  const latencyNow = latencyTs.length ? latencyTs[latencyTs.length - 1]!.latency_ms : null;
  const latencyThen = latencyTs.length ? latencyTs[0]!.latency_ms : null;
  const latencyDelta = latencyNow != null && latencyThen != null ? latencyNow - latencyThen : null;

  const sessionsData = {
    mode: "normal" as const,
    value: strip?.active_sessions ?? data.sessions_active ?? 0,
    peers: peersCurrent ?? 0,
    deltaPercent:
      peersThen != null && peersThen !== 0 && peersNowFromSeries != null
        ? ((peersNowFromSeries - peersThen) / peersThen) * 100
        : undefined,
  };

  const incidentsData = {
    critical: incidentCounts.critical ?? 0,
    warning: incidentCounts.warning ?? 0,
    unhealthyNodes: data.incidents_count,
  };

  const telemetryData = {
    state: telemetryStateFromLastAt(lastAt),
    lastSampleLabel: lastSampleLabelFromLastAt(lastAt),
    series: timeseriesToSparkPoints(timeseries, (p) => p.peers ?? 0),
  };

  const latencyData = {
    errorRate: strip?.error_rate_pct ?? 0,
    trendDirection: (latencyDelta ?? 0) > 0 ? ("up" as const) : (latencyDelta ?? 0) < 0 ? ("down" as const) : ("flat" as const),
    trendDeltaMs: Math.abs(latencyDelta ?? 0),
    p95Ms: latencyNow ?? strip?.avg_latency_ms ?? 0,
  };

  const clusterMetrics: ClusterMetricRow[] = [
    { key: "CPU", value: avgCpu != null ? `${avgCpu}%` : "—", percent: avgCpu ?? undefined },
    { key: "RAM", value: avgRam != null ? `${avgRam}%` : "—", percent: avgRam ?? undefined },
    { key: "Bandwidth", value: strip ? formatBps(strip.total_throughput_bps ?? 0) : "—" },
  ];
  const clusterData = { mode: "grid" as const, metrics: clusterMetrics };

  const overviewDescription = (
    <>
      <span className="dot" aria-hidden="true" />
      <span>Last updated {lastUpdatedLabel}</span>
      <span className="sep">·</span>
      <span>
        Sessions:{" "}
        {strip?.active_sessions ?? data.sessions_active}
      </span>
    </>
  );
  const overviewActions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="act"
        aria-label="Export"
        onClick={() => {
          toast.showToast({ variant: "info", title: "Export", description: "Export not available yet." });
        }}
      >
        Export
      </Button>
      <Button
        variant="default"
        onClick={handleRefresh}
        disabled={isRefetching}
        data-testid="dashboard-refresh"
        aria-label={refreshLabel}
        className="act"
      >
        {isRefetching && <><Skeleton width={14} height={14} className="btn-loading-skeleton" aria-hidden />{" "}</>}
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
    </>
  );

  return (
    <PageLayout
      title="Overview"
      description={overviewDescription}
      actions={overviewActions}
      pageClass={[
        "overview-page",
        `overview-page--density-${preferences.density}`,
        `overview-page--emphasis-${preferences.emphasis}`,
      ].join(" ")}
      dataTestId="dashboard-page"
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
      <section className="page-section overview-page__kpis" aria-label="Key metrics">
        <SectionHeader label="System Status" size="lg" note="Last 1 hour" />
        <div className="kpi-row">
          <SessionsWidget
            data={sessionsData}
            href="/servers"
            title="Sessions"
            subtitle="vs start of window"
            className="edge eb"
          />
          <IncidentsWidget
            data={incidentsData}
            href="/servers"
            title="Incidents"
            subtitle="live signals"
            className="edge ea"
          />
          <TelemetryWidget
            data={telemetryData}
            href="/telemetry"
            title="Telemetry"
            subtitle="freshness"
            className="edge eg"
          />
          <ApiLatencyWidget
            data={latencyData}
            href="/telemetry"
            title="API latency"
            subtitle="p95 · vs start of window"
            className="edge ev"
          />
          <ClusterLoadWidget
            data={clusterData}
            href="/telemetry"
            title="Cluster load"
            subtitle="CPU/RAM (avg)"
            className="edge et"
          />
        </div>
      </section>

      <section className="page-section overview-page__live" aria-label="Live metrics">
        <SectionHeader label="Live Metrics" size="lg" note="Last 1 hour" />
        <div className="chart-row">
        <Widget
          title="Peers"
          subtitle="Last 1 hour"
          href="/telemetry"
          size="medium"
          className="edge eb cc"
        >
          {timeseries.length > 1 ? (
            <OverviewPeersChart points={timeseries} currentPeers={peersCurrent} />
          ) : (
            <EmptyState message="No peers timeseries yet." />
          )}
        </Widget>

        <Widget
          title="Bandwidth"
          subtitle="Last 1 hour (RX+TX)"
          href="/telemetry"
          size="medium"
          className="edge ev cc"
        >
          {timeseries.length > 2 ? (
            <OverviewThroughputChart points={timeseries} />
          ) : (
            <EmptyState message="No bandwidth timeseries yet." />
          )}
        </Widget>

        <Widget
          title="Top nodes"
          subtitle="By traffic"
          href="/servers"
          size="medium"
          className="edge et cc"
        >
          {topTraffic.length > 0 ? (
            <ul className="nlist" aria-label="Top nodes by traffic">
              {topTraffic.map((s, idx) => {
                const rank = idx + 1;
                const value = s.throughput_bps ?? 0;
                const max = maxTrafficBps || 0;
                const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
                const { statusClass, statusLabel } = getServerStatusVisual(s.status);
                return (
                  <li key={s.id} className="ni">
                    <span className="nrank">{rank}</span>
                    <span
                      className={`nst ${statusClass}`}
                      role="img"
                      aria-label={`Status: ${statusLabel}`}
                    />
                    <span className="nname">
                      {s.name}
                      {s.region && (
                        <span className="type-meta overview-widget__list-region"> · {s.region}</span>
                      )}
                    </span>
                    <span className="nval">
                      {formatBps(value)}
                    </span>
                    <Nbar pct={pct} variant="blue" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState message="No node traffic yet." />
          )}
        </Widget>

        <Widget
          title="Hot nodes"
          subtitle="By CPU"
          href="/servers"
          size="medium"
          className="edge ea cc"
        >
          {topCpu.length > 0 ? (
            <ul className="nlist" aria-label="Top nodes by CPU">
              {topCpu.map((s, idx) => {
                const rank = idx + 1;
                const value = s.cpu_pct ?? 0;
                const max = maxCpuPct || 0;
                const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
                const { statusClass, statusLabel } = getServerStatusVisual(s.status);
                const valueClass =
                  value >= 85 ? "nval wc" : value >= 60 ? "nval" : "nval";
                return (
                  <li key={s.id} className="ni">
                    <span className="nrank">{rank}</span>
                    <span
                      className={`nst ${statusClass}`}
                      role="img"
                      aria-label={`Status: ${statusLabel}`}
                    />
                    <span className="nname">
                      {s.name}
                      {s.region && (
                        <span className="type-meta overview-widget__list-region"> · {s.region}</span>
                      )}
                    </span>
                    <span className={valueClass}>
                      {s.cpu_pct != null ? `${s.cpu_pct}%` : "—"}
                    </span>
                    <Nbar
                      pct={pct}
                      variant={value >= 85 ? "red" : value >= 60 ? "amber" : "blue"}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState message="No CPU telemetry yet." />
          )}
        </Widget>
        </div>
      </section>

      <Drawer
        open={settingsOpen}
        onClose={closeSettings}
        title="Dashboard settings"
        size="sm"
        data-testid="dashboard-settings-modal"
      >
        <div className="overview-page__settings">
          <label className="input-label">
            Density
            <select
              className="input"
              value={preferences.density}
              onChange={(event) => updatePreferences({ density: event.target.value as OverviewDensity })}
              aria-label="Dashboard density"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="input-label">
            Widget emphasis
            <select
              className="input"
              value={preferences.emphasis}
              onChange={(event) => updatePreferences({ emphasis: event.target.value as OverviewEmphasis })}
              aria-label="Widget emphasis"
            >
              <option value="balanced">Balanced</option>
              <option value="operational">Operational</option>
            </select>
          </label>
          <label className="input-label">
            Auto-refresh
            <select
              className="input"
              value={preferences.autoRefresh}
              onChange={(event) => updatePreferences({ autoRefresh: event.target.value as OverviewAutoRefresh })}
              aria-label="Auto-refresh"
            >
              <option value="off">Off</option>
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 60 seconds</option>
            </select>
          </label>
          <MetaText className="overview-page__settings-text">
            Preferences are stored in this browser and apply immediately to the dashboard layout.
          </MetaText>
        </div>
      </Drawer>
    </PageLayout>
  );
}
