import { useNavigate } from "react-router-dom";
import { ReferralShareCard, SessionMissing } from "@/components";
import {
  FallbackScreen,
  Skeleton,
  InlineAlert,
  PageScaffold,
  PageHeader,
} from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { useReferralPageModel } from "@/page-models";
import { useI18n } from "@/hooks";

export function ReferralPage() {
  const navigate = useNavigate();
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
      <PageScaffold>
        <PageHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          onBack={() => navigate(-1)}
          backAriaLabel={t("common.back_aria")}
        />
        <Stack gap="4">
          <Skeleton className="skeleton-h-3xl" />
        </Stack>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <PageHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        onBack={() => navigate(-1)}
        backAriaLabel={t("common.back_aria")}
      />
      {model.showUpsellReferral ? (
        <Stack gap="4">
          <InlineAlert
            variant="info"
            title={t("plan.cta_upgrade_plan")}
            body={t("referral.upsell_description")}
          />
        </Stack>
      ) : null}
      <ReferralShareCard
        botUsername={model.botUsername}
        shareUrl={model.shareUrl}
        isOnline={model.isOnline}
        onCopy={model.copyToClipboard}
      />
    </PageScaffold>
  );
}
