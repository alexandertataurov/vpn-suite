import { Button, SettingsCard } from "@/design-system";

export interface SettingsReconnectCardProps {
  title: string;
  message: string;
  ctaLabel: string;
  loadingLabel: string;
  reconnecting: boolean;
  onReconnect: () => void;
}

export function SettingsReconnectCard({
  title,
  message,
  ctaLabel,
  loadingLabel,
  reconnecting,
  onReconnect,
}: SettingsReconnectCardProps) {
  return (
    <SettingsCard className="module-card settings-account-card">
      <div className="settings-account-banner">
        <div className="settings-account-banner__identity">
          <div className="settings-account-banner__avatar settings-account-banner__avatar--empty" aria-hidden>
            ?
          </div>
          <div className="settings-account-banner__copy">
            <div className="settings-account-banner__name">{title}</div>
            <div className="settings-account-banner__meta">{message}</div>
          </div>
        </div>
      </div>
      <Button type="button" variant="primary" onClick={onReconnect} disabled={reconnecting}>
        {reconnecting ? loadingLabel : ctaLabel}
      </Button>
    </SettingsCard>
  );
}
