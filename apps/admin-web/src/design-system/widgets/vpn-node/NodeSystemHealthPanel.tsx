import { SectionHeader } from "@/design-system/primitives/SectionHeader";
import { formatPct, dash } from "@/features/vpn-nodes/format";
import type { VpnNodeSystem } from "@/features/vpn-nodes/types";

interface NodeSystemHealthPanelProps {
  system: VpnNodeSystem | null | undefined;
}

export function NodeSystemHealthPanel({ system }: NodeSystemHealthPanelProps) {
  if (system == null) {
    return (
      <section className="vpn-node-drilldown-panel" role="region" aria-label="Node and system">
        <SectionHeader label="Node-agent & system" />
        <p className="type-meta vpn-node-drilldown-muted">{dash(null)}</p>
      </section>
    );
  }
  return (
    <section className="vpn-node-drilldown-panel" role="region" aria-label="Node and system">
      <SectionHeader label="Node-agent & system" />
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">CPU</span>
        <span className="vpn-node-drilldown-v type-data-mono">
          {system.cpu_pct != null ? formatPct(system.cpu_pct) : dash(null)}
        </span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">RAM</span>
        <span className="vpn-node-drilldown-v type-data-mono">
          {system.ram_pct != null ? formatPct(system.ram_pct) : dash(null)}
        </span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Disk</span>
        <span className="vpn-node-drilldown-v type-data-mono">
          {system.disk_pct != null ? formatPct(system.disk_pct) : dash(null)}
        </span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">NIC errors</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(system.nic_errs)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k">Container health</span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(system.container_health)}</span>
      </div>
      <div className="vpn-node-drilldown-kv">
        <span className="vpn-node-drilldown-k" title="NTP/clock (placeholder when available)">
          NTP
        </span>
        <span className="vpn-node-drilldown-v type-data-mono">{dash(system.ntp_status)}</span>
      </div>
    </section>
  );
}
