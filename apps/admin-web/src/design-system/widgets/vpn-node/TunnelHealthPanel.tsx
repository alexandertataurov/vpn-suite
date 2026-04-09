import { SectionHeader } from "@/design-system/primitives/SectionHeader";
import { dash } from "@/features/vpn-nodes/format";
import type { VpnNodeInterface } from "@/features/vpn-nodes/types";

interface TunnelHealthPanelProps {
  iface: VpnNodeInterface | null | undefined;
}

export function TunnelHealthPanel({ iface }: TunnelHealthPanelProps) {
  if (iface == null) {
    return (
      <section className="vpn-node-drilldown-panel" role="region" aria-label="Tunnel and interface">
        <SectionHeader label="Tunnel & interface" />
        <p className="type-meta vpn-node-drilldown-muted">{dash(null)}</p>
      </section>
    );
  }
  return (
    <section className="vpn-node-drilldown-panel" role="region" aria-label="Tunnel and interface">
      <SectionHeader label="Tunnel & interface" />
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Interface up</span>
        <span className="vpn-node-drilldown-v type-data-mono">
          {iface.if_up == null ? dash(null) : iface.if_up ? "Yes" : "No"}
        </span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">MTU</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(iface.mtu)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Errors</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(iface.errors)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Drops</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(iface.drops)}</span>
      </div>
    </section>
  );
}
