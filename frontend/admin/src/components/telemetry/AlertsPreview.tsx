import type { AlertItem } from "@vpn-suite/shared/types";
import { PrimitiveBadge } from "@/design-system";
import { formatDateTime } from "@vpn-suite/shared";

interface AlertsPreviewProps {
  items: AlertItem[];
}

function variantFor(severity: AlertItem["severity"]): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

export function AlertsPreview({ items }: AlertsPreviewProps) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted">
        No active alerts.
      </p>
    );
  }

  const sorted = [...items].sort((a, b) => {
    const sevOrder: Record<AlertItem["severity"], number> = { critical: 0, warning: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });

  const top = sorted.slice(0, 5);

  return (
    <ul className="alerts-list">
      {top.map((alert) => (
        <li key={alert.id} className="alert-row">
          <div className="alert-main">
            <PrimitiveBadge variant={variantFor(alert.severity)}>{alert.severity}</PrimitiveBadge>
            <span className="alert-rule">{alert.rule}</span>
            <span className="text-muted">{alert.container_name ?? alert.host_id}</span>
            <span className="text-muted">{formatDateTime(alert.created_at)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

