import type { ReactNode } from "react";
import { formatDateLong } from "../../utils/format";
import { Badge as PrimitiveBadge } from "../primitives/Badge";
import { subscriptionStatusToVariant } from "../../statusMap";

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
        <p className="profile-card-meta">
          Valid until {dateLabel}
        </p>
        <PrimitiveBadge variant={subscriptionStatusToVariant(status)}>{statusLabel(status)}</PrimitiveBadge>
      </div>
      {primaryAction ? (
        <div className="profile-card-actions">{primaryAction}</div>
      ) : null}
    </div>
  );
}
