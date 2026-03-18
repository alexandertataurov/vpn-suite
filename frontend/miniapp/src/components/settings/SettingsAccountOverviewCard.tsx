import { Avatar, Button, PillChip } from "@/design-system";
import { useNavigate } from "react-router-dom";

export interface SettingsAccountOverviewCardProps {
  initial: string;
  name: string;
  photoUrl?: string;
  eyebrowLabel: string;
  statusLabel: string;
  /** Uppercase eyebrow for renewal section. Default "RENEWAL". */
  renewalEyebrowLabel?: string;
  renewalLabel: string;
  renewalValue?: string | null;
  planBadgeLabel?: string | null;
  planActionTo: string;
  hasPlan: boolean;
  planCtaLabel: string;
}

export function SettingsAccountOverviewCard({
  initial,
  name,
  photoUrl,
  eyebrowLabel,
  statusLabel,
  renewalEyebrowLabel = "RENEWAL",
  renewalLabel,
  renewalValue,
  planBadgeLabel,
  planActionTo,
  hasPlan,
  planCtaLabel,
}: SettingsAccountOverviewCardProps) {
  const navigate = useNavigate();
  const pillVariant = hasPlan ? "active" : "beta";

  return (
    <div className="settings-account-card">
      <div className="settings-account-card__group">
        <Avatar initials={initial} size="md" src={photoUrl} className="settings-account-avatar settings-account-avatar--circle" />
        <div className="settings-account-card__meta">
          <span className="settings-account-eyebrow">{eyebrowLabel}</span>
          <span className="settings-account-name">{name}</span>
          {planBadgeLabel && (
            <span className="settings-account-chip">
              <PillChip variant={pillVariant}>{planBadgeLabel}</PillChip>
            </span>
          )}
          <span className="settings-account-status">{statusLabel}</span>
        </div>
      </div>

      <div className="settings-account-card__renewal">
        <span className="settings-account-eyebrow">{renewalEyebrowLabel}</span>
        <span className="settings-account-renewal-value">
          {renewalValue ?? renewalLabel}
        </span>
      </div>

      {!hasPlan && (
        <Button variant="primary" className="settings-account-cta" onClick={() => navigate(planActionTo)}>
          {planCtaLabel}
        </Button>
      )}
    </div>
  );
}
