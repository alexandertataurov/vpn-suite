import { Button, StatusChip } from "@/design-system";
import { useNavigate } from "react-router-dom";
import { VpnBoundaryNote } from "@/components/VpnBoundaryNote";

export interface SettingsAccountOverviewCardProps {
  initial: string;
  name: string;
  photoUrl?: string;
  eyebrowLabel: string;
  statusLabel: string;
  renewalLabel: string;
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
  renewalLabel,
  planBadgeLabel,
  planActionTo,
  hasPlan,
  planCtaLabel,
}: SettingsAccountOverviewCardProps) {
  const navigate = useNavigate();

  return (
    <div className="modern-hero-card stagger-1">
      <div className="modern-status-group">
        <div className="modern-avatar settings-account-avatar">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="settings-account-banner__avatar-image" />
          ) : (
            initial
          )}
        </div>
        <div className="modern-status-text">
          <div className="modern-header-label">{eyebrowLabel}</div>
          <div className="modern-status-title settings-account-title">{name}</div>
          <div className="modern-status-subtitle">
            {planBadgeLabel && (
              <StatusChip variant={hasPlan ? "active" : "info"} className="u-mr-8">
                {planBadgeLabel}
              </StatusChip>
            )}
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="modern-metrics-row">
        <div className="modern-metric-item">
          <span className="modern-metric-label">RENEWAL</span>
          <span className="modern-metric-value settings-account-metric-value">{renewalLabel}</span>
        </div>
        {!hasPlan && (
          <div className="modern-metric-item modern-align-right">
            <Button variant="primary" className="settings-account-cta-button" onClick={() => navigate(planActionTo)}>
              {planCtaLabel}
            </Button>
          </div>
        )}
      </div>
      
      <div className="u-mt-4">
        <VpnBoundaryNote />
      </div>
    </div>
  );
}
