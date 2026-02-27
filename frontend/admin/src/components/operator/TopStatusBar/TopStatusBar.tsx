import type { OperatorHealthStrip } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";

export interface TopStatusBarProps {
  data: OperatorHealthStrip;
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
const EMPTY_TITLE = "Telemetry not reported yet (Prometheus metric missing or delayed)";
const THROUGHPUT_ZERO_TITLE =
  "Throughput is not yet exposed by the operator API; 0 B until backend adds the metric";

export function TopStatusBar({ data }: TopStatusBarProps) {
  const errState = data.api_status === "ok" ? "ok" : data.api_status === "down" ? "down" : "degraded";
  const coreDown = data.api_status === "down";
  const peersValue = data.peers_active != null ? String(data.peers_active) : EMPTY_LABEL;
  const throughputValue =
    data.total_throughput_bps > 0 ? formatBytes(data.total_throughput_bps) : "0 B";
  const throughputZero = data.total_throughput_bps <= 0;
  const latencyValue =
    data.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms)} ms` : EMPTY_LABEL;

  return (
    <div className="operator-health-strip operator-top-bar-health" aria-label="System health">
      <div
        className={`operator-health-block operator-health-block--core${coreDown ? " operator-health-block--down" : ""}`}
        aria-label="Core health"
      >
        <div className="operator-topbar-cell" title="Admin API liveness">
          <span className="operator-topbar-label">API</span>
          <span className={`operator-topbar-value operator-topbar-value--primary ${statusClass(data.api_status)}`}>
            {formatStatus(data.api_status)}
          </span>
        </div>
        <div className="operator-topbar-cell" title="Prometheus scrape status">
          <span className="operator-topbar-label">Prom</span>
          <span className={`operator-topbar-value operator-topbar-value--primary ${statusClass(data.prometheus_status)}`}>
            {formatStatus(data.prometheus_status)}
          </span>
        </div>
        <div className="operator-topbar-cell" title="Online / total nodes">
          <span className="operator-topbar-label">Nodes</span>
          <span className="operator-topbar-value operator-topbar-value--primary">
            {data.online_nodes}/{data.total_nodes}
          </span>
        </div>
      </div>
      <div className="operator-health-block operator-health-block--activity" aria-label="Activity metrics">
        <div className="operator-topbar-cell" title="Active peer sessions">
          <span className="operator-topbar-label">Sessions</span>
          <span className="operator-topbar-value operator-topbar-value--secondary">{data.active_sessions}</span>
        </div>
        <div
          className="operator-topbar-cell"
          title={data.peers_active != null ? "Peers with recent handshake activity" : EMPTY_TITLE}
        >
          <span className="operator-topbar-label">Peers</span>
          <span
            className={`operator-topbar-value operator-topbar-value--secondary${data.peers_active == null ? " operator-topbar-value--muted" : ""}`}
          >
            {peersValue}
          </span>
        </div>
        <div
          className="operator-topbar-cell"
          title={
            throughputZero
              ? THROUGHPUT_ZERO_TITLE
              : "Throughput (current rate, bytes/s)"
          }
        >
          <span className="operator-topbar-label">Throughput</span>
          <span
            className={`operator-topbar-value operator-topbar-value--secondary${throughputZero ? " operator-topbar-value--muted" : ""}`}
          >
            {throughputValue}
          </span>
        </div>
      </div>
      <div className="operator-health-block operator-health-block--performance" aria-label="Performance">
        <div
          className="operator-topbar-cell"
          title={data.avg_latency_ms != null ? "Average latency (ms)" : EMPTY_TITLE}
        >
          <span className="operator-topbar-label">Latency</span>
          <span
            className={`operator-topbar-value operator-topbar-value--secondary${data.avg_latency_ms == null ? " operator-topbar-value--muted" : ""}`}
          >
            {latencyValue}
          </span>
        </div>
        <div className="operator-topbar-cell" title="Error rate percentage">
          <span className="operator-topbar-label">Error %</span>
          <span className={`operator-topbar-value operator-topbar-value--secondary ${statusClass(errState)}`}>
            {data.error_rate_pct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
