import { Drawer, ErrorState, Skeleton } from "@/design-system/primitives";
import { AlertDetails } from "./AlertDetails";
import { AlertStrip } from "./AlertStrip";
import { LatencyQualityPanel } from "./LatencyQualityPanel";
import { NodeSystemHealthPanel } from "./NodeSystemHealthPanel";
import { PeerHealthTable } from "./PeerHealthTable";
import { SectionHeader } from "@/design-system/primitives/SectionHeader";
import { TrafficCapacityPanel } from "./TrafficCapacityPanel";
import { TunnelHealthPanel } from "./TunnelHealthPanel";
import { useVpnNodeDetail } from "@/features/vpn-nodes/useVpnNodeDetail";
import type { VpnNodeDetail } from "@/features/vpn-nodes/types";

interface VpnNodeDrilldownProps {
  nodeId: string | null;
  open: boolean;
  onClose: () => void;
}

export function VpnNodeDrilldown({ nodeId, open, onClose }: VpnNodeDrilldownProps) {
  const { data: detail, isLoading, isError, error, refetch } = useVpnNodeDetail(nodeId);

  const title =
    detail?.card?.identity?.name ?? detail?.card?.identity?.node_id ?? nodeId ?? "Node";

  const body = (() => {
    if (!open || !nodeId) return null;
    if (isLoading) return <DrilldownSkeleton />;
    if (isError)
      return (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load node detail"}
          onRetry={() => void refetch()}
        />
      );
    if (!detail) return null;
    return <DrilldownContent detail={detail} />;
  })();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      data-testid="vpn-node-drilldown"
    >
      {body}
    </Drawer>
  );
}

function DrilldownSkeleton() {
  return (
    <div className="vpn-node-drilldown-body">
      <Skeleton height={24} />
      <Skeleton height={80} />
      <Skeleton height={24} />
      <Skeleton height={120} />
    </div>
  );
}

function DrilldownContent({ detail }: { detail: VpnNodeDetail }) {
  const { card, peers, rtt_timeseries_1h, rtt_timeseries_24h, loss_timeseries_1h, interface: iface, system } =
    detail;

  return (
    <div className="vpn-node-drilldown-body">
      <section className="vpn-node-drilldown-panel" role="region" aria-label="Node status">
        <div className="vpn-node-drilldown-header-meta">
          <span className="type-meta">
            {card.identity.region && `${card.identity.region} · `}
            {card.identity.public_ip ?? "—"}
          </span>
          <span className={`vpn-node-drilldown-badge vpn-node-drilldown-badge--${card.identity.health_state}`}>
            {card.identity.health_state}
          </span>
        </div>
        {card.alerts.length > 0 && (
          <div className="vpn-node-drilldown-alerts">
            <AlertStrip alerts={card.alerts} />
          </div>
        )}
      </section>

      {card.alerts.length > 0 && (
        <AlertDetails alerts={card.alerts} runbookUrl={null} />
      )}

      <section className="vpn-node-drilldown-panel" role="region" aria-label="Peer health">
        <SectionHeader label="Peer health" note={`${peers.length} peers`} />
        <PeerHealthTable peers={peers} />
      </section>

      <LatencyQualityPanel
        kpis={card.kpis}
        rtt1h={rtt_timeseries_1h}
        rtt24h={rtt_timeseries_24h}
        loss1h={loss_timeseries_1h}
      />

      <TrafficCapacityPanel kpis={card.kpis} />

      <TunnelHealthPanel iface={iface ?? undefined} />

      <NodeSystemHealthPanel system={system ?? undefined} />
    </div>
  );
}
