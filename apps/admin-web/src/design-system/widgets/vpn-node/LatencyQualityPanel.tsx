import { SectionHeader } from "@/design-system/primitives/SectionHeader";
import { formatMs, formatPct, dash } from "@/features/vpn-nodes/format";
import type { VpnNodeKpis, RttLossPoint } from "@/features/vpn-nodes/types";

interface LatencyQualityPanelProps {
  kpis: VpnNodeKpis;
  rtt1h: RttLossPoint[];
  rtt24h: RttLossPoint[];
  loss1h: RttLossPoint[];
}

function summarizeTrend(points: RttLossPoint[], formatter: (value: number | null | undefined) => string): string {
  if (points.length === 0) return dash(null);
  const first = points[0]?.value;
  const last = points[points.length - 1]?.value;
  if (first == null || last == null) return dash(null);
  const delta = last - first;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return `${formatter(last)} · ${direction} ${formatter(Math.abs(delta))}`;
}

export function LatencyQualityPanel({ kpis, rtt1h, rtt24h, loss1h }: LatencyQualityPanelProps) {
  const hasTimeseries = (rtt1h?.length ?? 0) > 0 || (rtt24h?.length ?? 0) > 0 || (loss1h?.length ?? 0) > 0;

  return (
    <section className="vpn-node-drilldown-panel" role="region" aria-label="Latency and path quality">
      <SectionHeader label="Latency & path quality" />
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">RTT p50</span>
        <span className="vpn-node-drilldown-v type-data-mono">{formatMs(kpis.rtt_p50_ms)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">RTT p95</span>
        <span className="vpn-node-drilldown-v type-data-mono">{formatMs(kpis.rtt_p95_ms)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Loss p50</span>
        <span className="vpn-node-drilldown-v type-data-mono">{formatPct(kpis.loss_p50_pct)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Loss p95</span>
        <span className="vpn-node-drilldown-v type-data-mono">{formatPct(kpis.loss_p95_pct)}</span>
      </div>
      {hasTimeseries ? (
        <div className="vpn-node-drilldown-trends" aria-label="Latency and loss trend summaries">
          <div className="vpn-node-drilldown-kv">
            <span className="vpn-node-drilldown-k">RTT 1h trend</span>
            <span className="vpn-node-drilldown-v type-data-mono">{summarizeTrend(rtt1h, formatMs)}</span>
          </div>
          <div className="vpn-node-drilldown-kv">
            <span className="vpn-node-drilldown-k">RTT 24h trend</span>
            <span className="vpn-node-drilldown-v type-data-mono">{summarizeTrend(rtt24h, formatMs)}</span>
          </div>
          <div className="vpn-node-drilldown-kv">
            <span className="vpn-node-drilldown-k">Loss 1h trend</span>
            <span className="vpn-node-drilldown-v type-data-mono">{summarizeTrend(loss1h, formatPct)}</span>
          </div>
        </div>
      ) : (
        <p className="type-meta vpn-node-drilldown-panel-note vpn-node-drilldown-muted">
          No RTT/loss timeseries available for this node.
        </p>
      )}
    </section>
  );
}
