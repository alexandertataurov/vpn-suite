import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Grid3X3, RefreshCw, Server, Users } from "lucide-react";
import { Button, InlineAlert, RelativeTime, Skeleton, PrimitiveBadge } from "@vpn-suite/shared/ui";
import type { OperatorDashboardOut } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";
import { api } from "../../api/client";
import { OPERATOR_DASHBOARD_KEY } from "../../api/query-keys";
import { cooldownRemainingMs, isNetworkUnreachableError, shouldRetryQuery } from "../../utils/queryPolicy";
import {
  ClusterMatrix,
  IncidentPanel,
  OperatorServerTable,
  UserSessionsTable,
  FreshnessBadge,
  TelemetryHealthWidget,
} from "../../components/operator";
import { TimeRangePicker } from "../../components/TimeRangePicker";
import { ChartFrame } from "../../charts/ChartFrame";
import { deriveResource, useResourceFromQuery } from "../../hooks/useResource";
import { EChart } from "../../charts/EChart";
import { makeOpsSparklineOption } from "../../charts/presets/opsSparkline";
import { getChartColors } from "../../charts/chartConfig";
import { getChartTheme } from "../../charts/theme";
import type { XY } from "../../charts/timeseries";

function freshnessFromAgeMs(ageMs: number): "fresh" | "degraded" | "stale" {
  const ageMin = ageMs / 60_000;
  if (ageMin > 5) return "stale";
  if (ageMin > 2) return "degraded";
  return "fresh";
}

const CHART_HEIGHT = 220;

const TIME_RANGE_OPTIONS = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
];

export function OperatorDashboardContent() {
  const [timeRange, setTimeRange] = useState("1h");
  const [networkCooldownUntil, setNetworkCooldownUntil] = useState<number | null>(null);
  const [serverFilter, setServerFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery<OperatorDashboardOut>({
    queryKey: [...OPERATOR_DASHBOARD_KEY, timeRange],
    queryFn: ({ signal }) =>
      api.get<OperatorDashboardOut>(`/overview/operator?time_range=${timeRange}`, { signal }),
    staleTime: 15_000,
    refetchInterval: () => {
      const remaining = cooldownRemainingMs(networkCooldownUntil);
      if (remaining > 0) return remaining;
      return 30_000;
    },
    retry: shouldRetryQuery,
  });

  const operatorResource = useResourceFromQuery(
    `GET /overview/operator?time_range=${timeRange}`,
    [...OPERATOR_DASHBOARD_KEY, timeRange],
    query,
    15_000,
    { isEmpty: (data) => !data }
  );
  const incidentsResource = deriveResource(
    operatorResource,
    "Incidents",
    query.data?.incidents,
    15_000,
    (data) => !data || data.length === 0
  );
  const serversResource = deriveResource(
    operatorResource,
    "Servers",
    query.data?.servers,
    15_000,
    (data) => !data || data.length === 0
  );
  const telemetryResource = deriveResource(
    operatorResource,
    "Telemetry",
    query.data?.timeseries,
    15_000,
    (data) => !data || data.length === 0
  );

  const isNetworkError = isNetworkUnreachableError(query.error);
  const cooldownMs = cooldownRemainingMs(networkCooldownUntil);
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
      await operatorResource.refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [operatorResource, setNetworkCooldownUntil]);

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

  const points = useMemo(() => query.data?.timeseries ?? [], [query.data?.timeseries]);
  const bandwidthDownload = useMemo<XY[]>(() => points.map((p) => [p.ts * 1000, p.rx] as XY), [points]);
  const bandwidthUpload = useMemo<XY[]>(() => points.map((p) => [p.ts * 1000, p.tx] as XY), [points]);
  const connections = useMemo<XY[]>(() => points.map((p) => [p.ts * 1000, p.peers] as XY), [points]);
  const tz = "utc" as const;

  const bandwidthOption = useMemo(() => {
    const colors = getChartColors();
    const theme = getChartTheme();
    return makeOpsSparklineOption({
      tz,
      series: [
        { name: "Download", data: bandwidthDownload, color: colors.primary.solid, area: true, areaColor: colors.primary.area },
        { name: "Upload", data: bandwidthUpload, color: theme.series.muted, area: false },
      ],
      tooltipValue: (_name, v) => (v == null ? "—" : `${Math.round(v)} B`),
    });
  }, [bandwidthDownload, bandwidthUpload]);

  const connectionsOption = useMemo(() => {
    const colors = getChartColors();
    return makeOpsSparklineOption({
      tz,
      series: [
        { name: "Connections", data: connections, color: colors.primary.solid, area: true, areaColor: colors.primary.area },
      ],
      tooltipValue: (_name, v) => (v == null ? "—" : String(Math.round(v))),
    });
  }, [connections]);

  const lastThroughputStr =
    points.length > 0
      ? formatBytes((points[points.length - 1]!.rx ?? 0) + (points[points.length - 1]!.tx ?? 0))
      : "—";
  const lastConnectionsStr = points.length > 0 && points[points.length - 1]?.peers != null ? String(points[points.length - 1]!.peers) : "—";

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
        <div className="operator-grid-cell operator-grid-cell--span-12 operator-grid-cell--no-border operator-card">
          <div className="operator-section-title"><Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Server Table</div>
          <OperatorServerTable rows={[]} onSync={handleSync} loading filter={serverFilter} onFilterChange={setServerFilter} />
        </div>
      </div>
    );
  }

  if (operatorResource.status === "error" && query.error) {
    const is404 = query.error instanceof ApiError && query.error.statusCode === 404;
    const requestId = query.error instanceof ApiError ? query.error.requestId : undefined;
    return (
      <div className="operator-dashboard">
        <div className="operator-health-strip operator-health-strip--error">
          {isNetworkError ? (
            <InlineAlert
              variant="error"
              title="API unreachable"
              message={`DNS/network resolution failed. Auto-refresh paused for ${Math.ceil(cooldownMs / 1000)}s.`}
            />
          ) : null}
          <div className="operator-health-cell">
            <div className="operator-health-value operator-health-value--down">
              {is404 ? "Operator endpoint not found (404)" : "Backend error"}
            </div>
          </div>
          {!is404 && requestId && (
            <p className="operator-health-label operator-error-text">
              Request ID: {requestId}
            </p>
          )}
          {is404 && (
            <p className="operator-health-label operator-error-text">
              Deploy the latest admin-api and restart the service to enable the operator dashboard.
            </p>
          )}
          <div className="operator-error-actions">
            <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
              Retry
            </Button>
            <Link to="/servers" className="operator-error-link">
              <Button variant="ghost" size="sm">
                View Servers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const d = query.data;

  const degradedBanner = d.data_status === "degraded" && (() => {
    const lastTs = d.last_successful_sample_ts ? new Date(d.last_successful_sample_ts).getTime() : null;
    const ageMs = lastTs ? Date.now() - lastTs : Infinity;
    const ageMin = ageMs / 60_000;
    let severity: "info" | "warning" | "error" = "info";
    if (ageMin > 5 || !lastTs) severity = "error";
    else if (ageMin > 2) severity = "warning";
    const source = lastTs ? "Prometheus" : "API fallback";
    const lastLabel = lastTs ? new Date(lastTs).toLocaleString() : "Never";
    return (
      <div className="operator-degraded-banner">
        <InlineAlert
          variant={severity === "error" ? "error" : severity === "warning" ? "warning" : "info"}
          title={`[${severity.toUpperCase()}] Partial data · Source: ${source} · Last successful: ${lastLabel}`}
          message="Prometheus/telemetry is degraded. Showing fallback data."
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>Retry now</Button>
              <Link to="/telemetry">
                <Button variant="ghost" size="sm">View details →</Button>
              </Link>
            </>
          }
        />
      </div>
    );
  })();

  return (
    <div className="operator-dashboard" data-testid="operator-dashboard">
      {degradedBanner}
      {/* Row 1: Cluster Health (8) | Telemetry Health (4) */}
      <div className="operator-grid-cell operator-grid-cell--span-8 operator-card">
        <div className="operator-section-title">
          <Grid3X3 className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Cluster Health Matrix
        </div>
        <ClusterMatrix rows={d.cluster_matrix} />
      </div>
      <div className="operator-grid-cell operator-grid-cell--span-4 operator-card">
        <TelemetryHealthWidget />
      </div>

      {/* Row 2: Traffic & Load (8) | Active Incidents (4) */}
      <div className="operator-grid-cell operator-grid-cell--span-8 operator-card">
        <div className="operator-section-title">
          <Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Traffic & Load
        </div>
        <div className="operator-traffic-toolbar">
            <TimeRangePicker
              value={timeRange}
              onChange={setTimeRange}
              options={TIME_RANGE_OPTIONS}
              aria-label="Time range"
            />
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
        {(d.data_status === "degraded" && d.last_successful_sample_ts) && (() => {
            const ageMs = Date.now() - new Date(d.last_successful_sample_ts!).getTime();
            const isStale = ageMs > 2 * 60 * 1000;
            return isStale ? (
              <div className="operator-chart-stale">
                Stale · Last: <RelativeTime date={d.last_successful_sample_ts!} />
              </div>
            ) : null;
        })()}
        {points.length > 0 && telemetryResource.status === "stale" ? (
          <div className="operator-panel-meta operator-panel-meta--minimal">
            <FreshnessBadge freshness="stale">Stale</FreshnessBadge>
          </div>
        ) : null}
        <div className="operator-charts-grid">
            <div className="operator-chart-wrap">
              <span className="operator-chart-caption" aria-hidden>
                Throughput · {lastThroughputStr}
              </span>
              <ChartFrame
                height={CHART_HEIGHT}
                ariaLabel="Throughput rx/tx"
                isLoading={telemetryResource.status === "loading" || telemetryResource.status === "idle"}
                error={telemetryResource.status === "error" ? telemetryResource.error : undefined}
                empty={telemetryResource.status === "empty"}
                stale={telemetryResource.status === "stale"}
                onRetry={handleRefresh}
              >
                <EChart className="ref-echart" option={bandwidthOption} />
              </ChartFrame>
            </div>
            <div className="operator-chart-wrap">
              <span className="operator-chart-caption" aria-hidden>
                Connections · {lastConnectionsStr}
              </span>
              <ChartFrame
                height={CHART_HEIGHT}
                ariaLabel="Active connections"
                isLoading={telemetryResource.status === "loading" || telemetryResource.status === "idle"}
                error={telemetryResource.status === "error" ? telemetryResource.error : undefined}
                empty={telemetryResource.status === "empty"}
                stale={telemetryResource.status === "stale"}
                onRetry={handleRefresh}
              >
                <EChart className="ref-echart" option={connectionsOption} />
              </ChartFrame>
            </div>
        </div>
      </div>
      <div className="operator-grid-cell operator-grid-cell--span-4 operator-card">
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

      {/* Row 3: User Sessions (8) */}
      <div className="operator-grid-cell operator-grid-cell--span-8 operator-card">
        <div className="operator-section-title">
          <Users className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          User Sessions
        </div>
        <UserSessionsTable />
      </div>

      {/* Row 4: Server Table (12) */}
      <div className="operator-grid-cell operator-grid-cell--span-12 operator-grid-cell--no-border operator-card">
        <div className="operator-section-title">
          <Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Server Table
        </div>
        {serversResource.status === "stale" ? (
          <div className="operator-panel-meta operator-panel-meta--minimal">
            <PrimitiveBadge variant="warning" size="sm">Stale</PrimitiveBadge>
          </div>
        ) : null}
        <OperatorServerTable
          rows={d.servers}
          onSync={handleSync}
          loading={serversResource.status === "loading" || serversResource.status === "idle"}
          filter={serverFilter}
          onFilterChange={setServerFilter}
        />
      </div>
    </div>
  );
}
