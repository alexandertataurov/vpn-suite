import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Grid3X3, RefreshCw, Server, Users } from "lucide-react";
import { Button, InlineAlert, RelativeTime, Skeleton } from "@vpn-suite/shared/ui";
import type { OperatorDashboardOut } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { OPERATOR_DASHBOARD_KEY } from "../../api/query-keys";
import { cooldownRemainingMs, isNetworkUnreachableError, shouldRetryQuery } from "../../utils/queryPolicy";
import {
  ClusterMatrix,
  IncidentPanel,
  OperatorServerTable,
  UserSessionsTable,
  FreshnessBadge,
} from "../../components/operator";
import { TimeRangePicker } from "../../components/TimeRangePicker";
import { ChartFrame } from "../../charts/ChartFrame";
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

const TIME_RANGE_OPTIONS = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "6h", label: "6h" },
  { value: "24h", label: "24h" },
];

export function OperatorDashboardContent() {
  const queryClient = useQueryClient();
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
      await queryClient.refetchQueries({ queryKey: OPERATOR_DASHBOARD_KEY });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, setNetworkCooldownUntil]);

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
      tooltipValue: (_name, v) => (v == null ? "—" : String(Math.round(v))),
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

  if (query.isLoading || !query.data) {
    return (
      <div className="operator-dashboard" data-testid="operator-dashboard">
        <div className="operator-grid-row">
          <div className="operator-grid-cell">
            <div className="operator-section-title"><Grid3X3 className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Cluster Health Matrix</div>
            <div className="operator-table-loading">
              <Skeleton height={120} />
            </div>
          </div>
          <div className="operator-grid-cell">
            <div className="operator-section-title"><AlertTriangle className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Active Incidents</div>
            <Skeleton height={80} />
          </div>
        </div>
        <div className="operator-grid-row">
          <div className="operator-grid-cell">
            <div className="operator-section-title"><Activity className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Traffic & Load</div>
            <Skeleton height={160} />
          </div>
          <div className="operator-grid-cell">
            <div className="operator-section-title"><Users className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> User Sessions</div>
            <Skeleton height={100} />
          </div>
        </div>
        <div className="operator-grid-cell operator-grid-cell--no-border">
          <div className="operator-section-title"><Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} /> Server Table</div>
          <OperatorServerTable rows={[]} onSync={handleSync} loading filter={serverFilter} onFilterChange={setServerFilter} />
        </div>
      </div>
    );
  }

  if (query.error) {
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
      <div className="operator-grid-row">
        <div className="operator-grid-cell">
          <div className="operator-section-title">
            <Grid3X3 className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
            Cluster Health Matrix
          </div>
          <ClusterMatrix rows={d.cluster_matrix} />
        </div>
        <div className="operator-grid-cell">
          <div className="operator-section-title">
            <AlertTriangle className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
            Active Incidents
          </div>
          <IncidentPanel incidents={d.incidents} />
        </div>
      </div>

      <div className="operator-grid-row">
        <div className="operator-grid-cell">
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
          <div className="operator-charts-grid">
            <div className="operator-chart-wrap">
              {points.length > 0 ? (
                <>
                  <ChartFrame height={160} ariaLabel="Throughput rx/tx">
                    <EChart className="ref-echart" option={bandwidthOption} />
                  </ChartFrame>
                  {(() => {
                    const lastPoint = points[points.length - 1];
                    if (!lastPoint) return null;
                    return (
                      <div className="operator-chart-last" aria-label="Last updated">
                        <FreshnessBadge freshness={freshnessFromAgeMs(Date.now() - lastPoint.ts * 1000)}>
                          <RelativeTime date={new Date(lastPoint.ts * 1000)} />
                        </FreshnessBadge>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="operator-chart-placeholder" aria-hidden>—</div>
              )}
            </div>
            <div className="operator-chart-wrap">
              {points.length > 0 ? (
                <>
                  <ChartFrame height={160} ariaLabel="Active connections">
                    <EChart className="ref-echart" option={connectionsOption} />
                  </ChartFrame>
                  {(() => {
                    const lastPoint = points[points.length - 1];
                    if (!lastPoint) return null;
                    return (
                      <div className="operator-chart-last" aria-label="Last updated">
                        <FreshnessBadge freshness={freshnessFromAgeMs(Date.now() - lastPoint.ts * 1000)}>
                          <RelativeTime date={new Date(lastPoint.ts * 1000)} />
                        </FreshnessBadge>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="operator-chart-placeholder" aria-hidden>—</div>
              )}
            </div>
          </div>
        </div>
        <div className="operator-grid-cell">
          <div className="operator-section-title">
            <Users className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
            User Sessions
          </div>
          <UserSessionsTable />
        </div>
      </div>

      <div className="operator-grid-cell operator-grid-cell--no-border">
        <div className="operator-section-title">
          <Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Server Table
        </div>
        <OperatorServerTable rows={d.servers} onSync={handleSync} filter={serverFilter} onFilterChange={setServerFilter} />
      </div>
    </div>
  );
}
