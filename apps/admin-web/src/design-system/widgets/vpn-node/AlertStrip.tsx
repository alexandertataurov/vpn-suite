import type { VpnNodeAlert } from "@/features/vpn-nodes/types";

/** Maps API severity to display variant. Backend typically sends critical | warning; info uses muted. */
function alertVariant(severity: string): "danger" | "warning" | "muted" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "muted";
}

interface AlertStripProps {
  alerts: VpnNodeAlert[];
  onAlertClick?: () => void;
  className?: string;
}

export function AlertStrip({ alerts, onAlertClick, className }: AlertStripProps) {
  if (!alerts.length) return null;
  return (
    <div
      className={`vpn-node-card__alerts ${className ?? ""}`.trim()}
      role="list"
      aria-label="Node alerts"
    >
      {alerts.slice(0, 3).map((a, i) => (
        <button
          key={`${a.metric}-${i}`}
          type="button"
          className={`vpn-node-alert vpn-node-alert--${alertVariant(a.severity)}`}
          onClick={onAlertClick}
          aria-label={`${a.metric}: ${a.value}`}
        >
          <span className="vpn-node-alert__metric">{a.metric}</span>
          <span className="vpn-node-alert__value">{String(a.value)}</span>
        </button>
      ))}
    </div>
  );
}
