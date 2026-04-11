import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/app/components";
import { FallbackScreen } from "@/design-system/patterns";
import {
  FooterHelp,
  InlineAlert,
  PageCardSection,
  PageHeader,
  PageLayout,
  PageScaffold,
  Skeleton,
  Stack,
} from "@/design-system";
import { ReferralShareCard } from "@/design-system/recipes";
import { useReferralPageModel } from "@/features/referral/model/useReferralPageModel";
import { useI18n } from "@/hooks/useI18n";

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
        <PageLayout scrollable={false}>
          <PageHeader
            title={model.header.title}
            subtitle={model.header.subtitle}
            onBack={() => navigate(-1)}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="2">
            <Skeleton variant="card" height={160} />
            <Skeleton variant="line" width="55%" />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
        <PageHeader
          title={model.header.title}
          subtitle={model.header.subtitle}
          onBack={() => navigate(-1)}
          backAriaLabel={t("common.back_aria")}
        />
        <Stack gap="2">
          {model.showUpsellReferral ? (
            <InlineAlert
              variant="info"
              label={t("plan.cta_upgrade_plan")}
              message={t("referral.upsell_description")}
            />
          ) : null}
          {model.statsData != null ? (
            <PageCardSection title={t("referral.stats_section_title")} cardTone="blue">
              <Stack gap="3">
                <p className="referral-stat-line">{t("referral.stats_total", { count: model.totalReferrals })}</p>
                <p className="referral-stat-line">{t("referral.stats_active", { count: model.activeReferrals })}</p>
                <p className="referral-stat-line">{t("referral.stats_pending", { count: model.pendingRewards })}</p>
                <p className="referral-stat-line">{t("referral.stats_earned_days", { count: model.earnedDays })}</p>
                {model.nextBonusDays != null ? (
                  <p className="referral-stat-line">
                    {t("referral.stats_next_bonus", { count: model.nextBonusDays })}
                  </p>
                ) : null}
              </Stack>
            </PageCardSection>
          ) : null}
          <ReferralShareCard
            botUsername={model.botUsername}
            shareUrl={model.shareUrl}
            isOnline={model.isOnline}
            onCopy={model.copyToClipboard}
            onNativeShare={() => void model.handleShare()}
          />
        </Stack>
        <FooterHelp
          note={t("footer.having_trouble")}
          linkLabel={t("footer.view_setup_guide")}
          onLinkClick={() => navigate("/support")}
        />
      </PageLayout>
    </PageScaffold>
  );
}
