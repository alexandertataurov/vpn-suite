import { SectionHeader } from "@/design-system/primitives/SectionHeader";
import { formatMs, formatPct, dash } from "@/features/vpn-nodes/format";
import type { VpnNodeKpis, RttLossPoint } from "@/features/vpn-nodes/types";

interface LatencyQualityPanelProps {
  kpis: VpnNodeKpis;
  rtt1h: RttLossPoint[];
  rtt24h: RttLossPoint[];
  loss1h: RttLossPoint[];
}

export function LatencyQualityPanel({ kpis, rtt1h, rtt24h, loss1h }: LatencyQualityPanelProps) {
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
      {((rtt1h?.length ?? 0) > 0 || (rtt24h?.length ?? 0) > 0 || (loss1h?.length ?? 0) > 0) ? (
        <p className="type-meta vpn-node-drilldown-panel-note">
          Timeseries: 1h/24h (placeholder — data when Prometheus available).
        </p>
      ) : (
        <p className="type-meta vpn-node-drilldown-panel-note vpn-node-drilldown-muted">
          RTT/loss over time: {dash(null)}
        </p>
      )}
    </section>
  );
}
