import type { OperatorHealthStrip } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";

export interface HealthStripProps {
  data: OperatorHealthStrip;
}

function statusClass(s: string): "ok" | "degraded" | "down" | "unknown" {
  if (s === "ok" || s === "down") return s;
  if (s === "degraded") return "degraded";
  return "unknown";
}

function healthScore(h: OperatorHealthStrip): number {
  let s = 0;
  if (h.api_status === "ok") s += 25;
  else if (h.api_status === "degraded") s += 12;
  if (h.prometheus_status === "ok") s += 25;
  s += (h.online_nodes / Math.max(h.total_nodes, 1)) * 25;
  s += Math.max(0, 1 - h.error_rate_pct / 100) * 25;
  return Math.min(100, Math.round(s));
}

const TOOLTIPS: Record<string, string> = {
  API: "Admin API liveness",
  Prom: "Prometheus scrape status",
  Nodes: "Online / total cluster nodes",
  Sessions: "Active peer sessions",
  "Peers Active": "Peers with recent handshake activity",
  "Handshake Max": "Max handshake age across peers (seconds)",
  Throughput: "Total cluster throughput",
  Latency: "Average latency (ms)",
  "Error %": "Error rate percentage",
  Outline: "Outline service status (metrics + poller)",
  "Outline Keys": "Outline access keys total",
  "Outline Traffic": "Outline traffic (bytes/sec)",
  Updated: "Last data update",
  Mode: "Refresh mode (polling/stream)",
};

function Cell({
  label,
  value,
  state,
  degraded,
}: {
  label: string;
  value: string;
  state?: "ok" | "degraded" | "down" | "unknown";
  degraded?: boolean;
}) {
  return (
    <div
      className={`operator-health-cell${degraded ? " operator-health-cell--degraded" : ""}`}
      title={TOOLTIPS[label]}
    >
      <div className="operator-health-label">{label}</div>
      <div className={`operator-health-value${state ? ` operator-health-value--${state}` : ""}`}>{value}</div>
    </div>
  );
}

export function HealthStrip({ data }: HealthStripProps) {
  const score = healthScore(data);
  const apiState = statusClass(data.api_status);
  const promState = statusClass(data.prometheus_status);
  const errState = statusClass(data.api_status);
  const apiDegraded = apiState === "degraded" || apiState === "down";
  const promDegraded = promState === "degraded" || promState === "down";

  return (
    <div className="operator-health-strip" role="region" aria-label="Global health">
      <div className="operator-health-group operator-health-group--score">
        <div className="operator-health-cell" title="Composite health score (0–100)">
          <div className="operator-health-label">Score</div>
          <div className="operator-health-value">
            {data.freshness === "fresh" && (
              <span
                className={`operator-live-dot${data.refresh_mode === "stream" ? " operator-live-dot--stream" : ""}`}
                title="Live"
              />
            )}
            {score}
          </div>
        </div>
      </div>
      <div className="operator-health-group">
        <Cell label="API" value={data.api_status.toUpperCase()} state={apiState} degraded={apiDegraded} />
        <Cell label="Prom" value={data.prometheus_status.toUpperCase()} state={promState} degraded={promDegraded} />
      </div>
      <div className="operator-health-group">
        <Cell label="Nodes" value={`${data.online_nodes}/${data.total_nodes}`} />
        <Cell label="Sessions" value={String(data.active_sessions)} />
        <Cell label="Peers Active" value={data.peers_active != null ? String(data.peers_active) : "—"} />
        <Cell
          label="Handshake Max"
          value={data.handshake_max_age_sec != null ? `${data.handshake_max_age_sec}s` : "—"}
        />
        <Cell label="Throughput" value={data.total_throughput_bps > 0 ? formatBytes(data.total_throughput_bps) : "0 B"} />
      </div>
      <div className="operator-health-group">
        <Cell label="Latency" value={data.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms)}ms` : "—"} />
        <Cell label="Error %" value={`${data.error_rate_pct.toFixed(2)}%`} state={errState} />
        <Cell
          label="Outline"
          value={(data.outline_status || "unknown").toUpperCase()}
          state={statusClass(data.outline_status || "unknown")}
        />
        <Cell
          label="Outline Keys"
          value={data.outline_keys_total != null ? String(data.outline_keys_total) : "—"}
        />
        <Cell
          label="Outline Traffic"
          value={data.outline_traffic_bps != null ? formatBytes(data.outline_traffic_bps) : "—"}
        />
      </div>
      <div className="operator-health-group operator-health-group--last">
        <Cell label="Updated" value={new Date(data.last_updated).toLocaleTimeString("en-US", { hour12: false })} />
        <Cell label="Mode" value={data.refresh_mode} />
      </div>
    </div>
  );
}
