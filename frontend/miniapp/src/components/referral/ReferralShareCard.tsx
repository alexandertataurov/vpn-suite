import { MissionAlert, MissionPrimaryButton, PageCardSection, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface ReferralShareCardProps {
  botUsername: string;
  shareUrl: string;
  isOnline: boolean;
  onCopy: () => void;
}

export function ReferralShareCard({
  botUsername,
  shareUrl,
  isOnline,
  onCopy,
}: ReferralShareCardProps) {
  const { t } = useI18n();

  return (
    <PageCardSection
      title={t("referral.share_link_card_title")}
      action={
        <StatusChip variant={botUsername ? "active" : "offline"}>
          {botUsername ? t("referral.share_link_ready_label") : t("referral.share_link_unavailable_label")}
        </StatusChip>
      }
      cardTone="green"
    >
      <MissionAlert
        tone="info"
        title={t("referral.status_badge_label")}
        message={t("referral.read_only_beta_message")}
      />
      {!botUsername ? (
        <MissionAlert
          tone="warning"
          title={t("referral.share_link_unavailable_alert_title")}
          message={t("referral.share_link_unavailable_alert_message")}
        />
      ) : null}
      <code className="code-block type-meta">
        {shareUrl || t("referral.share_url_unavailable_placeholder")}
      </code>
      <div className="miniapp-compact-actions">
        <MissionPrimaryButton
          onClick={onCopy}
          disabled={!shareUrl || !isOnline}
          className="miniapp-compact-action"
        >
          {t("referral.copy_link_button")}
        </MissionPrimaryButton>
      </div>
    </PageCardSection>
  );
}
