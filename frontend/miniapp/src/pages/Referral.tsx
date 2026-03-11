import { ReferralShareCard, SessionMissing } from "@/components";
import {
  FallbackScreen,
  Skeleton,
  PageCardSection,
  PageFrame,
  MissionAlert,
} from "@/design-system";
import { useReferralPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function ReferralPage() {
  const model = useReferralPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    return <SessionMissing message={t("referral.session_missing_message")} />;
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
        <PageCardSection cardTone="amber">
          <MissionAlert
            tone="info"
            title={t("plan.cta_upgrade_plan")}
            message={t("referral.upsell_description")}
          />
        </PageCardSection>
      ) : null}
      <ReferralShareCard
        botUsername={model.botUsername}
        shareUrl={model.shareUrl}
        isOnline={model.isOnline}
        onCopy={() => void model.copyToClipboard()}
      />
    </PageFrame>
  );
}
