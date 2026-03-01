import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import type { OperatorHealthStrip } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";
import { EChart } from "../../charts/EChart";
import { getChartTheme } from "../../charts/theme";
import type { TimeseriesForChart } from "../../domain/dashboard/types";

export interface HealthBarProps {
  data: OperatorHealthStrip;
  timeseries?: TimeseriesForChart | null;
}

function statusClass(s: string): string {
  if (s === "ok") return "operator-topbar-value--ok";
  if (s === "down") return "operator-topbar-value--down";
  if (s === "degraded") return "operator-topbar-value--degraded";
  return "operator-topbar-value--unknown";
}

function formatStatus(s: string): string {
  if (s === "ok") return "OK";
  if (s === "down") return "Down";
  if (s === "degraded") return "Degraded";
  return s;
}

const EMPTY_LABEL = "—";
const ERROR_RATE_THRESHOLD = 3;

const THROUGHPUT_GRADIENT = {
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "rgba(0,229,255,0.3)" },
    { offset: 1, color: "rgba(0,229,255,0)" },
  ],
};

function throughputSparklineOption(data: [number, number][]): EChartsOption {
  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 4, right: 4, top: 4, bottom: 4, containLabel: false },
    xAxis: { type: "time", show: false },
    yAxis: { type: "value", show: false, scale: true },
    series: [
      {
        type: "line",
        data,
        showSymbol: false,
        lineStyle: { color: "#00e5ff", width: 1.5 },
        areaStyle: { color: THROUGHPUT_GRADIENT },
        clip: true,
      },
    ],
  };
}

function microSparklineOption(
  data: [number, number | null][],
  color: string,
  opts?: { dashed?: boolean }
): EChartsOption {
  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 4, right: 4, top: 4, bottom: 4, containLabel: false },
    xAxis: { type: "time", show: false },
    yAxis: { type: "value", show: false, scale: true },
    series: [
      {
        type: "line",
        data,
        showSymbol: false,
        lineStyle: {
          color,
          width: 1.5,
          ...(opts?.dashed ? { type: "dashed", width: 1 } : {}),
        },
        areaStyle: opts?.dashed ? undefined : { color, opacity: 0.15 },
        clip: true,
      },
    ],
  };
}

export function HealthBar({ data, timeseries }: HealthBarProps) {
  const theme = getChartTheme();
  const coreDown = data.api_status === "down";
  const peersValue = data.peers_active != null ? String(data.peers_active) : EMPTY_LABEL;
  const throughputValue =
    data.total_throughput_bps > 0 ? formatBytes(data.total_throughput_bps) : "0 B";
  const throughputZero = data.total_throughput_bps <= 0;
  const latencyValue =
    data.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms)} ms` : EMPTY_LABEL;
  const errState =
    data.error_rate_pct > ERROR_RATE_THRESHOLD
      ? "degraded"
      : data.api_status === "ok"
        ? "ok"
        : data.api_status === "down"
          ? "down"
          : "degraded";
  const errorAboveThreshold = data.error_rate_pct > ERROR_RATE_THRESHOLD;

  const throughputSeries = useMemo(() => {
    if (!timeseries?.download?.length) return null;
    return timeseries.download.map(([ts], i) => {
      const up = timeseries.upload?.[i]?.[1] ?? 0;
      const down = timeseries.download[i]?.[1] ?? 0;
      return [ts, down + up] as [number, number];
    });
  }, [timeseries]);

  const connectionsSeries = useMemo(() => {
    if (!timeseries?.connections?.length) return null;
    return timeseries.connections as [number, number | null][];
  }, [timeseries]);

  const throughputOption = useMemo(
    () => (throughputSeries?.length ? throughputSparklineOption(throughputSeries) : null),
    [throughputSeries]
  );

  const connectionsHasData = useMemo(() => {
    if (!connectionsSeries?.length) return false;
    return connectionsSeries.some(([, v]) => v != null && v > 0);
  }, [connectionsSeries]);

  const connectionsOption = useMemo(() => {
    if (!connectionsSeries?.length || !connectionsHasData) return null;
    return microSparklineOption(connectionsSeries, theme.series.muted);
  }, [connectionsSeries, connectionsHasData, theme.series.muted]);

  const connectionsEmpty = !connectionsOption;

  return (
    <div
      className="operator-health-strip operator-health-strip--bar"
      role="region"
      aria-label="System health"
    >
      <div
        className={`operator-health-block operator-health-block--core${coreDown ? " operator-health-block--down" : ""}${data.api_status === "degraded" ? " operator-health-block--api-degraded" : ""}`}
        aria-label="Core health"
      >
        <div className="operator-health-bar-cell" title="Admin API liveness">
          <span className={`operator-health-bar-label operator-health-bar-label--api${data.api_status === "degraded" ? " operator-health-bar-label--demoted" : ""}`}>
            API
          </span>
          <span className={`operator-health-bar-value ${statusClass(data.api_status)}${data.api_status === "degraded" ? " operator-topbar-value--pulse" : ""}`}>
            {data.api_status === "degraded" ? (
              <>
                <span className="operator-health-bar-pulse-dot" aria-hidden />
                {formatStatus(data.api_status)}
              </>
            ) : (
              formatStatus(data.api_status)
            )}
          </span>
        </div>
        <div className="operator-health-bar-cell" title="Prometheus scrape status">
          <span className="operator-health-bar-label">Prometheus</span>
          <span className={`operator-health-bar-value ${statusClass(data.prometheus_status)}`}>
            {formatStatus(data.prometheus_status)}
          </span>
        </div>
        <div className="operator-health-bar-cell" title="Online / total nodes">
          <span className="operator-health-bar-label">Nodes</span>
          <span className="operator-health-bar-value">
            {data.online_nodes} / {data.total_nodes}
          </span>
        </div>
      </div>
      <div className="operator-health-block operator-health-block--activity">
        <div className="operator-health-bar-cell" title="Active peer sessions">
          <span className="operator-health-bar-label">Sessions</span>
          <span className="operator-health-bar-value">{data.active_sessions}</span>
        </div>
        <div className="operator-health-bar-cell" title="Peers with recent handshake activity">
          <span className="operator-health-bar-label">Peers</span>
          <span className={`operator-health-bar-value${data.peers_active == null ? " operator-topbar-value--muted" : ""}`}>
            {peersValue}
          </span>
        </div>
        <div className="operator-health-bar-cell operator-health-bar-cell--spark" title="Throughput (current rate, bytes/s)">
          <span className="operator-health-bar-label">Throughput</span>
          <span className="operator-health-bar-value-wrap">
            {throughputOption ? (
              <span className="operator-health-bar-sparkline" aria-hidden>
                <EChart option={throughputOption} height={32} />
              </span>
            ) : null}
            <span className={`operator-health-bar-value${throughputZero ? " operator-topbar-value--muted" : ""}`}>
              {throughputValue}
            </span>
          </span>
        </div>
      </div>
      <div className="operator-health-block operator-health-block--performance">
        <div className="operator-health-bar-cell operator-health-bar-cell--spark" title="Active connections trend">
          <span className="operator-health-bar-label">Connections</span>
          <span className="operator-health-bar-value-wrap">
            {connectionsOption ? (
              <span className="operator-health-bar-sparkline" aria-hidden>
                <EChart option={connectionsOption} height={32} />
              </span>
            ) : connectionsEmpty ? (
              <span className="operator-health-bar-sparkline operator-health-bar-sparkline--empty" aria-hidden>
                <svg width={48} height={32} viewBox="0 0 48 32" className="operator-sparkline-empty-svg">
                  <line x1={4} y1={16} x2={44} y2={16} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" className="operator-sparkline-empty-line" />
                </svg>
                <span className="operator-sparkline-no-data">NO DATA</span>
              </span>
            ) : null}
            <span className={`operator-health-bar-value${data.peers_active == null && !timeseries?.lastConnectionsStr ? " operator-topbar-value--muted" : ""}`}>
              {timeseries?.lastConnectionsStr ?? (data.peers_active != null ? String(data.peers_active) : EMPTY_LABEL)}
            </span>
          </span>
        </div>
        <div className="operator-health-bar-cell" title="Average latency (ms)">
          <span className="operator-health-bar-label">Latency</span>
          <span className={`operator-health-bar-value${data.avg_latency_ms == null ? " operator-topbar-value--muted" : ""}`}>
            {latencyValue}
          </span>
        </div>
        <div className="operator-health-bar-cell" title="Error rate percentage">
          <span className="operator-health-bar-label">Error %</span>
          <span className={`operator-health-bar-value ${statusClass(errState)}${errorAboveThreshold ? " operator-topbar-value--abort" : ""}`}>
            {data.error_rate_pct.toFixed(2)}%
            {errorAboveThreshold ? (
              <span className="operator-health-bar-above-threshold" aria-hidden>↑ above threshold</span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}
