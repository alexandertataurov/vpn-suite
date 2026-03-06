import { SectionHeader } from "@/design-system/primitives/SectionHeader";
import { formatBps, formatPct, dash } from "@/features/vpn-nodes/format";
import type { VpnNodeKpis } from "@/features/vpn-nodes/types";

interface TrafficCapacityPanelProps {
  kpis: VpnNodeKpis;
}

export function TrafficCapacityPanel({ kpis }: TrafficCapacityPanelProps) {
  const sat = kpis.peers_fullness_pct != null ? formatPct(kpis.peers_fullness_pct) : dash(null);
  return (
    <section className="vpn-node-drilldown-panel" role="region" aria-label="Traffic and capacity">
      <SectionHeader label="Traffic & capacity" />
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">RX (current)</span>
        <span className="vpn-node-drilldown-v type-data-mono">
          {formatBps(kpis.rx_bps ?? undefined)}
        </span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">TX (current)</span>
        <span className="vpn-node-drilldown-v type-data-mono">
          {formatBps(kpis.tx_bps ?? undefined)}
        </span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">RX 1h</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(kpis.rx_1h)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">TX 1h</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(kpis.tx_1h)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Peer saturation</span>
        <span className="vpn-node-drilldown-v type-data-mono">{sat}</span>
      </div>
    </section>
  );
}
