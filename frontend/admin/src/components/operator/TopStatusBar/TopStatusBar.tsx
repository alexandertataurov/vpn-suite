import type { OperatorHealthStrip } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";
import { RelativeTime } from "@vpn-suite/shared/ui";
import { StatusGroup } from "./StatusGroup";
import { HealthScore } from "./HealthScore";
import { SubsystemStatus } from "./SubsystemStatus";
import { MetricCell } from "./MetricCell";
import { ModeDisplay } from "./ModeDisplay";

export interface TopStatusBarProps {
  data: OperatorHealthStrip;
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

function scoreBreakdown(h: OperatorHealthStrip): string {
  const parts: string[] = [];
  parts.push(`API: ${h.api_status} (25pts)`);
  parts.push(`Prom: ${h.prometheus_status} (25pts)`);
  parts.push(`Nodes: ${h.online_nodes}/${h.total_nodes}`);
  parts.push(`Error: ${h.error_rate_pct.toFixed(2)}%`);
  return parts.join(" · ");
}

export function TopStatusBar({ data }: TopStatusBarProps) {
  const score = healthScore(data);
  const isStream = data.refresh_mode === "stream";
  const errState = data.api_status === "ok" ? "ok" : data.api_status === "down" ? "down" : "degraded";

  return (
    <div className="operator-health-strip operator-top-status-bar" role="region" aria-label="Global health">
      <StatusGroup title="System" aria-label="System health">
        <HealthScore
          value={score}
          breakdown={scoreBreakdown(data)}
          live={data.freshness === "fresh"}
          stream={isStream}
        />
        <SubsystemStatus name="API" status={data.api_status} title="Admin API liveness" />
        <SubsystemStatus name="Prom" status={data.prometheus_status} title="Prometheus scrape status" />
      </StatusGroup>
      <StatusGroup title="Cluster" aria-label="Cluster state">
        <MetricCell label="Nodes" value={`${data.online_nodes}/${data.total_nodes}`} title="Online / total" />
        <MetricCell label="Sessions" value={String(data.active_sessions)} title="Active peer sessions" />
        <MetricCell
          label="Peers Active"
          value={data.peers_active != null ? String(data.peers_active) : "—"}
          title="Peers with recent handshake activity"
        />
        <MetricCell
          label="Handshake Max"
          value={data.handshake_max_age_sec != null ? `${data.handshake_max_age_sec}s` : "—"}
          title="Max handshake age across peers"
        />
      </StatusGroup>
      <StatusGroup title="Performance" aria-label="Performance metrics">
        <MetricCell
          label="Latency"
          value={data.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms)}ms` : "—"}
          title="Average latency (ms)"
        />
        <MetricCell
          label="Error %"
          value={`${data.error_rate_pct.toFixed(2)}%`}
          state={errState}
          degraded={errState !== "ok"}
          title="Error rate"
        />
        <MetricCell
          label="Throughput"
          value={data.total_throughput_bps > 0 ? formatBytes(data.total_throughput_bps) : "0 B"}
          title="Total cluster throughput"
        />
      </StatusGroup>
      <StatusGroup title="Sync" aria-label="Data sync" className="operator-status-group--sync">
        <div className="operator-health-cell" title="Last data update">
          <div className="operator-health-label">Updated</div>
          <div className="operator-health-value">
            <RelativeTime date={data.last_updated} updateInterval={5000} title={new Date(data.last_updated).toISOString()} />
          </div>
        </div>
        <ModeDisplay mode={data.refresh_mode} interval="30s" stream={isStream} />
      </StatusGroup>
    </div>
  );
}
