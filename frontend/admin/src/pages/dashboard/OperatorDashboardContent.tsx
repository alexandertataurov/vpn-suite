import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Grid3X3, RefreshCw, Server, Users } from "lucide-react";
import { Button, RelativeTime, Skeleton, PrimitiveBadge } from "@vpn-suite/shared/ui";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { OPERATOR_DASHBOARD_KEY } from "../../api/query-keys";
import { cooldownRemainingMs, isNetworkUnreachableError } from "../../utils/queryPolicy";
import {
  ClusterMatrix,
  ErrorBanner,
  IncidentPanel,
  OperatorServerTable,
  PartialDataBanner,
  UserSessionsTable,
  FreshnessBadge,
  TelemetryHealthWidget,
} from "../../components/operator";
import { TelemetryKpiStrip } from "../../components/telemetry/TelemetryKpiStrip";
import { ChartFrame } from "../../charts/ChartFrame";
import { deriveResource, useResourceFromQuery } from "../../hooks/useResource";
import { EChart } from "../../charts/EChart";
import { makeOpsSparklineOption, formatCompact } from "../../charts/presets/opsSparkline";
import { getChartColors } from "../../charts/chartConfig";
import { getChartTheme } from "../../charts/theme";
import { useOperatorOverview } from "../../domain/dashboard";
import { selectTimeseriesForChart, selectDataStatus, selectLastSuccessfulSampleTs, selectClusterMatrix, selectServers } from "../../domain/dashboard";
import { useDashboardRefresh } from "../../hooks/useDashboardRefresh";

const CHART_HEIGHT = 240;

const TIME_RANGE_OPTIONS = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
];

const REFETCH_INTERVAL_MS = 2_000;

export function OperatorDashboardContent() {
  const [timeRange, setTimeRange] = useState("1h");
  const [networkCooldownUntil, setNetworkCooldownUntil] = useState<number | null>(null);
  const [serverFilter, setServerFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cooldownMs = cooldownRemainingMs(networkCooldownUntil);
  const { refresh: dashboardRefresh } = useDashboardRefresh();

  const query = useOperatorOverview(timeRange, {
    refetchInterval: () => (cooldownMs > 0 ? cooldownMs : REFETCH_INTERVAL_MS),
  });

  const operatorResource = useResourceFromQuery(
    `GET /overview/operator?time_range=${timeRange}`,
    [...OPERATOR_DASHBOARD_KEY, timeRange],
    query,
    8_000,
    { isEmpty: (data) => !data }
  );
  const incidentsResource = deriveResource(
    operatorResource,
    "Incidents",
    query.data?.incidents,
    8_000,
    (data) => !data || data.length === 0
  );
  const serversResource = deriveResource(
    operatorResource,
    "Servers",
    query.data?.servers,
    8_000,
    (data) => !data || data.length === 0
  );
  const telemetryResource = deriveResource(
    operatorResource,
    "Telemetry",
    query.data?.timeseries,
    8_000,
    (data) => !data || data.length === 0
  );

  const isNetworkError = isNetworkUnreachableError(query.error);
  useEffect(() => {
    if (isNetworkError && cooldownMs <= 0 && !query.isFetching) {
      setNetworkCooldownUntil(Date.now() + 60_000);
    }
    if (!query.error && networkCooldownUntil) {
      setNetworkCooldownUntil(null);
    }
  }, [cooldownMs, isNetworkError, networkCooldownUntil, query.error, query.isFetching]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setNetworkCooldownUntil(null);
    try {
      await dashboardRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [dashboardRefresh]);

  const handleSync = useCallback(
    async (id: string) => {
      try {
        await api.post(`/servers/${id}/sync`, {});
        handleRefresh();
      } catch {
        // Ignore
      }
    },
    [handleRefresh]
  );

  const timeseriesChart = useMemo(() => selectTimeseriesForChart(query.data ?? null), [query.data]);
  const tz = "utc" as const;

  const EMA_ALPHA = 0.35;
  const smoothSeries = (series: [number, number | null][]) => {
    let ema: number | null = null;
    return series.map(([ts, v]) => {
      const num = typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
      if (num != null) {
        ema = ema == null ? num : EMA_ALPHA * num + (1 - EMA_ALPHA) * ema;
        return [ts, Math.round(ema)] as [number, number | null];
      }
      return [ts, ema] as [number, number | null];
    });
  };

  const bandwidthOption = useMemo(() => {
    const colors = getChartColors();
    const theme = getChartTheme();
    const download = smoothSeries(timeseriesChart?.download ?? []);
    const upload = smoothSeries(timeseriesChart?.upload ?? []);
    return makeOpsSparklineOption({
      tz,
      containerWidth: 230,
      series: [
        { name: "Download bytes", data: download, color: colors.primary.solid, area: true, areaColor: colors.primary.area },
        { name: "Upload bytes", data: upload, color: theme.series.muted, area: false },
      ],
      tooltipValue: (_name, v) => {
        if (v == null) return "—";
        const n = Math.round(v);
        if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`;
        return `${n} B`;
      },
    });
  }, [timeseriesChart?.download, timeseriesChart?.upload]);

  const connectionsOption = useMemo(() => {
    const colors = getChartColors();
    const connections = smoothSeries(timeseriesChart?.connections ?? []);
    return makeOpsSparklineOption({
      tz,
      containerWidth: 230,
      series: [
        { name: "Connections", data: connections, color: colors.primary.solid, area: true, areaColor: colors.primary.area },
      ],
      tooltipValue: (_name, v) =>
        v == null ? "—" : `${formatCompact(Math.round(v))} connections`,
    });
  }, [timeseriesChart?.connections]);

  const throughputRateOption = useMemo(() => {
    const colors = getChartColors();
    const raw = timeseriesChart?.throughputBps ?? [];
    // EMA smoothing (alpha=0.35) so the line reflects sustained activity and doesn't drop to zero between polls
    const alpha = 0.35;
    let ema: number | null = null;
    const smoothedSeries: [number, number | null][] = raw.map(([ts, v]) => {
      const num = typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
      if (num != null) {
        ema = ema == null ? num : alpha * num + (1 - alpha) * ema;
        return [ts, Math.round(ema)];
      }
      return [ts, ema];
    });
    const rollingWindow = 8;
    const values = smoothedSeries.map(([, v]) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null));
    const avgSeries: [number, number | null][] = smoothedSeries.map(([ts], i) => {
      const start = Math.max(0, i - rollingWindow + 1);
      const slice = values.slice(start, i + 1).filter((v): v is number => v != null);
      const avg = slice.length > 0 ? slice.reduce((s, v) => s + v, 0) / slice.length : null;
      return [ts, avg];
    });
    return makeOpsSparklineOption({
      tz,
      containerWidth: 230,
      series: [
        {
          name: "Cluster throughput",
          data: smoothedSeries,
          color: colors.primary.solid,
          area: true,
          areaColor: colors.primary.area,
        },
        {
          name: "Avg throughput (rolling)",
          data: avgSeries,
          color: colors.primary.muted,
          area: false,
        },
      ],
      tooltipValue: (_name, v) => {
        if (v == null) return "—";
        const n = Math.round(v);
        if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB/s`;
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB/s`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB/s`;
        return `${n} B/s`;
      },
    });
  }, [timeseriesChart?.throughputBps]);

  const latencyOption = useMemo(() => {
    const colors = getChartColors();
    const series = smoothSeries(timeseriesChart?.latencyMs ?? []);
    return makeOpsSparklineOption({
      tz,
      containerWidth: 230,
      series: [
        {
          name: "P95 latency",
          data: series,
          color: colors.primary.solid,
          area: false,
        },
      ],
      tooltipValue: (_name, v) => {
        if (v == null) return "—";
        const n = Math.round(v);
        if (n >= 1000) return `${(n / 1000).toFixed(2)} s`;
        return `${n} ms`;
      },
    });
  }, [timeseriesChart?.latencyMs]);

  if (operatorResource.status === "loading" || operatorResource.status === "idle" || !query.data) {
    return (
      <div className="operator-dashboard" data-testid="operator-dashboard">
        <div className="operator-grid-cell operator-grid-cell--span-8 operator-card">
          <div className="operator-section-title"><Grid3X3 className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Cluster Health Matrix</div>
          <div className="operator-table-loading">
            <Skeleton height={120} />
          </div>
        </div>
        <div className="operator-grid-cell operator-grid-cell--span-4 operator-card">
          <div className="operator-section-title"><Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Telemetry health</div>
          <Skeleton height={56} />
        </div>
        <div className="operator-grid-cell operator-grid-cell--span-8 operator-card">
          <div className="operator-section-title"><Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Traffic & Load</div>
          <Skeleton height={CHART_HEIGHT} />
        </div>
        <div className="operator-grid-cell operator-grid-cell--span-4 operator-card">
          <div className="operator-section-title"><AlertTriangle className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Active Incidents</div>
          <Skeleton height={80} />
        </div>
        <div className="operator-grid-cell operator-grid-cell--span-8 operator-card">
          <div className="operator-section-title"><Users className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> User Sessions</div>
          <Skeleton height={100} />
        </div>
        <div className="operator-grid-cell operator-grid-cell--span-12 operator-card">
          <div className="operator-section-title"><Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Server Table</div>
          <OperatorServerTable rows={[]} onSync={handleSync} loading filter={serverFilter} onFilterChange={setServerFilter} />
        </div>
      </div>
    );
  }

  if (operatorResource.status === "error" && query.error) {
    const is404 = query.error instanceof ApiError && query.error.statusCode === 404;
    return (
      <div className="operator-dashboard">
        <div className="operator-health-strip operator-health-strip--error">
          {isNetworkError ? (
            <ErrorBanner
              title="API unreachable"
              message={`DNS/network resolution failed. Auto-refresh paused for ${Math.ceil(cooldownMs / 1000)}s.`}
              onRetry={() => query.refetch()}
            />
          ) : (
            <ErrorBanner
              title={is404 ? "Operator endpoint not found (404)" : "Backend error"}
              message={
                is404
                  ? "Deploy the latest admin-api and restart the service to enable the operator dashboard."
                  : undefined
              }
              error={query.error}
              onRetry={() => query.refetch()}
              actions={
                <>
                  <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
                    Retry
                  </Button>
                  <Link to="/servers" className="operator-error-link">
                    <Button variant="ghost" size="sm">
                      View Servers
                    </Button>
                  </Link>
                </>
              }
            />
          )}
        </div>
      </div>
    );
  }

  const d = query.data;

  const dataStatus = selectDataStatus(d);
  const lastSuccessTs = selectLastSuccessfulSampleTs(d);
  const degradedBanner =
    dataStatus === "degraded" &&
    (() => {
      const lastTs = lastSuccessTs ? new Date(lastSuccessTs).getTime() : null;
      const ageMs = lastTs ? Date.now() - lastTs : Infinity;
      const ageMin = ageMs / 60_000;
      let severity: "info" | "warning" | "error" = "info";
      if (ageMin > 5 || !lastTs) severity = "error";
      else if (ageMin > 2) severity = "warning";
      const source = lastTs ? "Prometheus" : "API fallback";
      const lastLabel = lastTs ? new Date(lastTs).toLocaleString() : "Never";
      return (
        <div className="operator-degraded-banner">
          <PartialDataBanner
            variant={severity}
            title={`[${severity.toUpperCase()}] Partial data · Source: ${source} · Last successful: ${lastLabel}`}
            message="Prometheus/telemetry is degraded. Showing fallback data."
            actions={
              <>
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  Retry now
                </Button>
                <Link to="/telemetry">
                  <Button variant="ghost" size="sm">
                    View details →
                  </Button>
                </Link>
              </>
            }
          />
        </div>
      );
    })();

  const clusterMatrixRows = selectClusterMatrix(d);
  const serverRows = selectServers(d);
  const clusterMatrixEmpty = clusterMatrixRows.length === 0;
  const incidentsEmpty = (incidentsResource.data?.length ?? 0) === 0;
  const trafficEmpty = (timeseriesChart?.download?.length ?? 0) === 0 && (timeseriesChart?.connections?.length ?? 0) === 0;
  const serversEmpty = serverRows.length === 0;
  const serversDense = serverRows.length > 10;

  return (
    <div className="operator-dashboard" data-testid="operator-dashboard">
      {degradedBanner}
      <div className="operator-dashboard__health-section">
        <h2 className="operator-dashboard__section-label" id="operator-section-health">
          Health &amp; status
        </h2>
        <div className="operator-dashboard__health-secondary" aria-labelledby="operator-section-health">
          <div className="operator-grid-cell operator-card" aria-labelledby="operator-section-health">
            <TelemetryHealthWidget />
          </div>
          <div
            className="operator-grid-cell operator-card"
            data-card-type="incidents"
            data-content-empty={incidentsEmpty ? "true" : undefined}
            aria-labelledby="operator-section-health"
          >
            <div className="operator-section-title operator-section-title--incidents">
              <AlertTriangle className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
              Active Incidents
              <span
                className={`operator-incident-count ${(incidentsResource.data?.length ?? 0) > 0 ? "operator-incident-count--active" : "operator-incident-count--zero"}`}
                aria-label={`${incidentsResource.data?.length ?? 0} active incidents`}
              >
                ({incidentsResource.data?.length ?? 0})
              </span>
            </div>
            <IncidentPanel resource={incidentsResource} onRetry={handleRefresh} />
          </div>
        </div>
        <div
          className="operator-grid-cell operator-grid-cell--span-12 operator-grid-cell--health-matrix operator-card"
          data-content-empty={clusterMatrixEmpty ? "true" : undefined}
          aria-labelledby="operator-section-health"
        >
          <div className="operator-section-title">
            <Grid3X3 className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
            Cluster Health Matrix
          </div>
          <div className="operator-card__table-wrap">
            <ClusterMatrix rows={clusterMatrixRows} />
          </div>
        </div>
      </div>

      <h2 className="operator-dashboard__section-label" id="operator-section-traffic">
        Traffic &amp; alerts
      </h2>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        data-content-empty={trafficEmpty ? "true" : undefined}
        aria-labelledby="operator-section-traffic"
      >
        <div className="operator-section-title">
          <Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Traffic &amp; Load
        </div>
        <TelemetryKpiStrip />
        {(d.data_status === "degraded" && d.last_successful_sample_ts) && (() => {
            const ageMs = Date.now() - new Date(d.last_successful_sample_ts!).getTime();
            const isStale = ageMs > 2 * 60 * 1000;
            return isStale ? (
              <div className="operator-chart-stale">
                Stale · Last: <RelativeTime date={d.last_successful_sample_ts!} />
              </div>
            ) : null;
        })()}
        {((timeseriesChart?.download?.length ?? 0) > 0 && telemetryResource.status === "stale") ? (
          <div className="operator-panel-meta operator-panel-meta--minimal">
            <FreshnessBadge freshness="stale">Stale</FreshnessBadge>
          </div>
        ) : null}
        <div className="operator-traffic-toolbar">
            <div className="operator-traffic-toolbar-buttons" role="group" aria-label="Time range">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={timeRange === opt.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(opt.value)}
                  className="operator-toolbar-btn"
                  aria-pressed={timeRange === opt.value}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              loading={isRefreshing}
              aria-label="Refresh"
              className="operator-toolbar-btn"
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={14} strokeWidth={2} aria-hidden /> Refresh
            </Button>
        </div>
        <div className="operator-charts-grid">
          <div className="operator-chart-wrap">
            <span
              className="operator-chart-caption"
              aria-hidden
              title="Aggregate RX+TX bytes at each sample"
            >
              Traffic bytes · {timeseriesChart?.lastThroughputStr ?? "—"}
            </span>
            <ChartFrame
              height={CHART_HEIGHT}
              ariaLabel="Download/upload bytes over time"
              isLoading={
                telemetryResource.status === "loading" || telemetryResource.status === "idle"
              }
              error={
                telemetryResource.status === "error" ? telemetryResource.error : undefined
              }
              empty={telemetryResource.status === "empty"}
              stale={telemetryResource.status === "stale"}
              onRetry={handleRefresh}
            >
              <EChart className="ref-echart" height={CHART_HEIGHT} option={bandwidthOption} />
            </ChartFrame>
          </div>
          <div className="operator-chart-wrap">
            <span className="operator-chart-caption" aria-hidden>
              Cluster throughput · {timeseriesChart?.lastThroughputRateStr ?? "—"}
            </span>
            <ChartFrame
              height={CHART_HEIGHT}
              ariaLabel="Cluster throughput over time"
              isLoading={
                telemetryResource.status === "loading" || telemetryResource.status === "idle"
              }
              error={
                telemetryResource.status === "error" ? telemetryResource.error : undefined
              }
              empty={telemetryResource.status === "empty"}
              stale={telemetryResource.status === "stale"}
              onRetry={handleRefresh}
            >
              <EChart className="ref-echart" height={CHART_HEIGHT} option={throughputRateOption} />
            </ChartFrame>
          </div>
          <div className="operator-chart-wrap">
            <span className="operator-chart-caption" aria-hidden>
              Connections · {timeseriesChart?.lastConnectionsStr ?? "—"}
            </span>
            <ChartFrame
              height={CHART_HEIGHT}
              ariaLabel="Active connections"
              isLoading={
                telemetryResource.status === "loading" || telemetryResource.status === "idle"
              }
              error={
                telemetryResource.status === "error" ? telemetryResource.error : undefined
              }
              empty={telemetryResource.status === "empty"}
              stale={telemetryResource.status === "stale"}
              onRetry={handleRefresh}
            >
              <EChart className="ref-echart" height={CHART_HEIGHT} option={connectionsOption} />
            </ChartFrame>
          </div>
          <div className="operator-chart-wrap">
            <span className="operator-chart-caption" aria-hidden>
              P95 latency · {timeseriesChart?.lastLatencyStr ?? "—"}
            </span>
            <ChartFrame
              height={CHART_HEIGHT}
              ariaLabel="P95 latency over time"
              isLoading={
                telemetryResource.status === "loading" || telemetryResource.status === "idle"
              }
              error={
                telemetryResource.status === "error" ? telemetryResource.error : undefined
              }
              empty={telemetryResource.status === "empty"}
              stale={telemetryResource.status === "stale"}
              onRetry={handleRefresh}
            >
              <EChart className="ref-echart" height={CHART_HEIGHT} option={latencyOption} />
            </ChartFrame>
          </div>
        </div>
      </div>

      <h2 className="operator-dashboard__section-label" id="operator-section-sessions">
        Sessions
      </h2>
      <div className="operator-grid-cell operator-grid-cell--span-12 operator-card" aria-labelledby="operator-section-sessions">
        <div className="operator-section-title">
          <Users className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          User Sessions
        </div>
        <div className="operator-card__table-wrap">
          <UserSessionsTable />
        </div>
      </div>

      <h2 className="operator-dashboard__section-label" id="operator-section-servers">
        Infrastructure
      </h2>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="operator-section-servers"
        data-content-empty={serversEmpty ? "true" : undefined}
        data-content-dense={serversDense ? "true" : undefined}
      >
        <div className="operator-section-title">
          <Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Server Table
        </div>
        {serversResource.status === "stale" ? (
          <div className="operator-panel-meta operator-panel-meta--minimal">
            <PrimitiveBadge variant="warning" size="sm">Stale</PrimitiveBadge>
          </div>
        ) : null}
        <div className="operator-card__table-wrap">
        <OperatorServerTable
          rows={serverRows}
          onSync={handleSync}
          loading={serversResource.status === "loading" || serversResource.status === "idle"}
          filter={serverFilter}
          onFilterChange={setServerFilter}
        />
        </div>
      </div>
    </div>
  );
}
