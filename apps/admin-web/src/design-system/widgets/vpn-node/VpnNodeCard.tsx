import { Badge } from "@/design-system/primitives";
import { formatBps, formatMs, formatPct, dash } from "@/features/vpn-nodes/format";
import type { VpnNodeCard as VpnNodeCardType } from "@/features/vpn-nodes/types";
import { AlertStrip } from "./AlertStrip";
import { VpnNodeSparkline } from "./VpnNodeSparkline";

interface VpnNodeCardProps {
  data: VpnNodeCardType;
  onClick?: () => void;
  className?: string;
}

function healthToVariant(state: string): "success" | "warning" | "danger" | "neutral" {
  switch (state) {
    case "ok":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "danger";
    default:
      return "neutral";
  }
}

export function VpnNodeCard({ data, onClick, className }: VpnNodeCardProps) {
  const { identity, kpis, alerts, sparkline_peers, sparkline_rx, sparkline_tx } = data;
  const variant = healthToVariant(identity.health_state);
  const hasSparklines =
    (sparkline_peers?.length ?? 0) > 0 ||
    (sparkline_rx?.length ?? 0) > 0 ||
    (sparkline_tx?.length ?? 0) > 0;

  return (
    <div
      className={`card edge et vpn-node-card ${onClick ? "vpn-node-card--interactive" : ""} ${className ?? ""}`.trim()}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onClick();
          return;
        }
        if (e.key === " " || e.key === "Spacebar") {
          // Match native button behavior: prevent page scroll on Space keydown.
          e.preventDefault();
        }
      } : undefined}
      onKeyUp={onClick ? (e) => {
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      data-testid="vpn-node-card"
    >
      <div className="vpn-node-card__head">
        <div className="vpn-node-card__identity">
          <span className="vpn-node-card__name" title={identity.node_id}>
            {identity.name ?? identity.node_id}
          </span>
          <span className="vpn-node-card__meta">
            {dash(identity.region)}
            {identity.public_ip != null && identity.public_ip !== "" && ` · ${identity.public_ip}`}
          </span>
        </div>
        <Badge variant={variant} size="sm" aria-label={`Health: ${identity.health_state}`}>
          {identity.health_state === "ok" ? "OK" : identity.health_state === "degraded" ? "Degraded" : "Down"}
        </Badge>
      </div>

      <div className="vpn-node-card__kpis">
        <div className="vpn-node-card__kpi">
          <span className="vpn-node-card__kpi-label">Peers</span>
          <span className="vpn-node-card__kpi-value">
            {dash(kpis.active_peers)}
            {kpis.peers_max != null ? ` / ${kpis.peers_max}` : ""}
            {kpis.peers_fullness_pct != null ? ` (${formatPct(kpis.peers_fullness_pct)})` : ""}
          </span>
        </div>
        <div className="vpn-node-card__kpi">
          <span className="vpn-node-card__kpi-label">RX/TX 1h</span>
          <span className="vpn-node-card__kpi-value">
            {formatBps(kpis.rx_1h)} / {formatBps(kpis.tx_1h)}
          </span>
        </div>
        <div className="vpn-node-card__kpi">
          <span className="vpn-node-card__kpi-label">Handshake</span>
          <span className="vpn-node-card__kpi-value">{formatPct(kpis.handshake_health_pct)}</span>
        </div>
        <div className="vpn-node-card__kpi">
          <span className="vpn-node-card__kpi-label">RTT p95</span>
          <span className="vpn-node-card__kpi-value" title="node-agent ping to tunnel IP">
            {formatMs(kpis.rtt_p95_ms)}
          </span>
        </div>
        <div className="vpn-node-card__kpi">
          <span className="vpn-node-card__kpi-label">Loss p95</span>
          <span className="vpn-node-card__kpi-value">{formatPct(kpis.loss_p95_pct)}</span>
        </div>
      </div>

      {hasSparklines && (
        <div className="vpn-node-card__sparklines">
          {(sparkline_peers?.length ?? 0) > 0 && (
            <div className="vpn-node-card__spark" title="Peers">
              <VpnNodeSparkline points={sparkline_peers} stroke="var(--chart-blue)" title="Peers" />
            </div>
          )}
          {(sparkline_rx?.length ?? 0) > 0 && (
            <div className="vpn-node-card__spark" title="RX">
              <VpnNodeSparkline points={sparkline_rx} stroke="var(--chart-violet)" title="RX" />
            </div>
          )}
          {(sparkline_tx?.length ?? 0) > 0 && (
            <div className="vpn-node-card__spark" title="TX">
              <VpnNodeSparkline points={sparkline_tx} stroke="var(--green)" title="TX" />
            </div>
          )}
        </div>
      )}

      <AlertStrip alerts={alerts} onAlertClick={onClick} />
    </div>
  );
}
