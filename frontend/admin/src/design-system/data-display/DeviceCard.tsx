import type { ReactNode } from "react";
import { formatDateLong } from "../../shared-inline/utils/format";
import { Badge } from "../primitives/Badge";
import { deviceStatusToVariant } from "../../shared-inline/statusMap";

export type DeviceStatus = "active" | "revoked";

export interface DeviceCardProps {
  id: string;
  name?: string | null;
  status: DeviceStatus;
  issuedAt: string;
  shortId?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
}

export function DeviceCard({
  id,
  name,
  status,
  issuedAt,
  shortId,
  primaryAction,
  secondaryActions,
  className = "",
}: DeviceCardProps) {
  const displayName = name || shortId || id.slice(0, 8);
  const dateLabel = formatDateLong(issuedAt);

  return (
    <div className={`device-card ${className}`.trim()}>
      <div className="device-card-main">
        <div className="device-card-info">
          <span className="device-card-name">{displayName}</span>
          {shortId && name ? <span className="device-card-id">{shortId}</span> : null}
          <Badge variant={deviceStatusToVariant(status)}>
            {status === "revoked" ? "Revoked" : "Active"}
          </Badge>
        </div>
        <span className="device-card-date">{dateLabel}</span>
      </div>
      {primaryAction || secondaryActions ? (
        <div className="device-card-actions">
          {primaryAction}
          {secondaryActions}
        </div>
      ) : null}
    </div>
  );
}
