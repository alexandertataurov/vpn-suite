import { SessionMissing } from "@/components";
import {
  FallbackScreen,
  Skeleton,
  PageCardSection,
  PageFrame,
  MissionAlert,
  MissionPrimaryButton,
} from "@/design-system";
import { useReferralPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function ReferralPage() {
  const model = useReferralPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    return (
      <PageFrame title={model.header.title} className="referral-page">
        <SessionMissing message={t("referral.session_missing_message")} />
      </PageFrame>
    );
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("referral.error_title_generic")}
        message={model.pageState.message ?? t("referral.error_message_generic")}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="referral-page">
        <Skeleton className="skeleton-h-3xl" />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="referral-page">
      {model.showUpsellReferral ? (
        <PageCardSection description={t("referral.upsell_description")} cardTone="amber">
          <MissionAlert
            tone="info"
            title={t("plan.cta_upgrade_plan")}
            message={t("referral.upsell_description")}
          />
        </PageCardSection>
      ) : null}
      <PageCardSection
        title={t("referral.share_link_card_title")}
        description={undefined}
        cardTone="green"
      >
        {!model.botUsername ? (
          <MissionAlert
            tone="warning"
            title={t("referral.share_link_unavailable_alert_title")}
            message={t("referral.share_link_unavailable_alert_message")}
          />
        ) : null}
        <code className="code-block type-meta">
          {model.shareUrl || t("referral.share_url_unavailable_placeholder")}
        </code>
        <div className="miniapp-compact-actions">
          <MissionPrimaryButton
            onClick={() => void model.copyToClipboard()}
            disabled={!model.shareUrl || !model.isOnline}
            className="miniapp-compact-action"
          >
            {t("referral.copy_link_button")}
          </MissionPrimaryButton>
        </div>
      </PageCardSection>
    </PageFrame>
  );
}
