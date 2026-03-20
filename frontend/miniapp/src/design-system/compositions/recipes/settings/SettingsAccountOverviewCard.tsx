import { Avatar, PillChip } from "@/design-system";
import "./SettingsAccountOverviewCard.css";

export type PlanStatus = "active" | "expiring" | "expired";

export interface SettingsAccountOverviewCardProps {
  name: string;
  initials: string;
  planName: string;
  planStatus: PlanStatus;
  renewalDate: string;
  devicesUsed: number;
  /** Device cap from subscription; omit when unknown (shows em dash). */
  devicesTotal: number | null;
  onEdit?: () => void;
}

function getStatusLabel(planStatus: PlanStatus): string {
  switch (planStatus) {
    case "active":
      return "Active";
    case "expiring":
      return "Expiring";
    case "expired":
      return "Expired";
  }
}

export function SettingsAccountOverviewCard({
  name,
  initials,
  planName,
  planStatus,
  renewalDate,
  devicesUsed,
  devicesTotal,
  onEdit,
}: SettingsAccountOverviewCardProps) {
  const handleClick = onEdit ? () => onEdit() : undefined;

  return (
    <div
      className={`account-card${onEdit ? "" : " account-card--readonly"}`}
      onClick={handleClick}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={
        onEdit
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEdit();
              }
            }
          : undefined
      }
    >
      <div className="ac-identity">
        <Avatar initials={initials} size="lg" />
        <div className="ac-identity-text">
          <span className="ac-eyebrow">Account</span>
          <span className="ac-name">{name}</span>
          <PillChip variant={planStatus} status={planStatus} showDot>
            {planName}
          </PillChip>
        </div>
      </div>

      <div className="ac-divider" />

      <div className="ac-stats">
        <div className="ac-stat">
          <span className="ac-stat-label">Renewal</span>
          <span className="ac-stat-value">{renewalDate}</span>
        </div>
        <div className="ac-stat-sep" />
        <div className="ac-stat">
          <span className="ac-stat-label">Devices</span>
          <span className="ac-stat-value">
            {devicesUsed}
            <span className="ac-stat-dim"> / {devicesTotal ?? "—"}</span>
          </span>
        </div>
        <div className="ac-stat-sep" />
        <div className="ac-stat">
          <span className="ac-stat-label">Status</span>
          <span className={`ac-stat-value ac-stat-value--${planStatus}`}>
            {getStatusLabel(planStatus)}
          </span>
        </div>
      </div>

      {onEdit ? (
        <div className="ac-edit-hint" aria-hidden>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
