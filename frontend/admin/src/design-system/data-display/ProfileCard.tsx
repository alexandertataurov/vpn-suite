import type { ReactNode } from "react";
import { formatDateLong } from "../../shared-inline/utils/format";
import { Badge } from "../primitives/Badge";
import { subscriptionStatusToVariant } from "../../shared-inline/statusMap";

export interface ProfileCardProps {
  planName?: string | null;
  planId?: string;
  validUntil: string;
  status: "active" | "expired" | "cancelled" | string;
  primaryAction?: ReactNode;
  className?: string;
}

function statusLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function ProfileCard({
  planName,
  planId,
  validUntil,
  status,
  primaryAction,
  className = "",
}: ProfileCardProps) {
  const dateLabel = formatDateLong(validUntil);
  const title = planName || planId || "Subscription";

  return (
    <div className={`profile-card ${className}`.trim()}>
      <div className="profile-card-main">
        <h3 className="profile-card-title">{title}</h3>
        <p className="profile-card-meta">Valid until {dateLabel}</p>
        <Badge variant={subscriptionStatusToVariant(status)}>{statusLabel(status)}</Badge>
      </div>
      {primaryAction ? <div className="profile-card-actions">{primaryAction}</div> : null}
    </div>
  );
}
