import { formatDateTime } from "@vpn-suite/shared";
import { PrimitiveBadge, Button, Card, Skeleton } from "@/design-system";
import { Heading } from "@/design-system";
import type { AlertItem } from "@vpn-suite/shared/types";

interface Props {
  items: AlertItem[];
  isLoading: boolean;
  error?: unknown;
}

function variantFor(severity: AlertItem["severity"]): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}

export function AlertsPanel({ items, isLoading, error }: Props) {
  return (
    <Card as="section" variant="outline" aria-label="Alerts">
      <div className="ref-section-head">
        <Heading level={3} className="ref-settings-title">Alerts</Heading>
      </div>

      <p className="text-muted">Acknowledge and silence controls are UI-ready (non-mutating in this phase).</p>

      {isLoading ? (
        <Skeleton height={120} />
      ) : error ? (
        <p className="text-warning" role="alert">Failed to load alerts telemetry.</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No active alerts.</p>
      ) : (
        <div className="alerts-list">
          {items.map((alert) => (
            <div className="alert-row" key={alert.id}>
              <div className="alert-main">
                <PrimitiveBadge variant={variantFor(alert.severity)}>{alert.severity}</PrimitiveBadge>
                <span className="alert-rule">{alert.rule}</span>
                <span className="text-muted">{alert.container_name ?? alert.host_id}</span>
                <span className="text-muted">{formatDateTime(alert.created_at)}</span>
              </div>
              <div className="alert-actions">
                <Button size="sm" variant="ghost" disabled>
                  Acknowledge
                </Button>
                <Button size="sm" variant="ghost" disabled>
                  Silence
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
