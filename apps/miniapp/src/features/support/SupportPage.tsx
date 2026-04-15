import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/app/components";
import { useOpenLink } from "@/hooks";
import {
  IconCreditCard,
  IconFileText,
  IconHelpCircle,
  IconMessageCircle,
  IconMonitor,
  IconRotateCw,
} from "@/design-system/icons";
import {
  CardRow,
  FaqDisclosureItem,
  FooterHelp,
  InlineAlert,
  PageHeader,
  PageLayout,
  PageScaffold,
  RowItem,
  SectionLabel,
  Skeleton,
  SkeletonList,
  Stack,
  StatusChip,
} from "@/design-system";
import { TroubleshooterFlowCard } from "@/design-system/recipes";
import { FallbackScreen } from "@/design-system/patterns";
import { useSupportPageModel } from "@/features/support/model/useSupportPageModel";
import { useI18n } from "@/hooks/useI18n";
import {
  getSupportContactHref,
} from "@/config/env";
import { buildSupportLegalQuickLinks, getSupportCardDescription } from "@/lib/help-resources/resources";

export function SupportPage() {
  const navigate = useNavigate();
  const model = useSupportPageModel();
  const supportHref = getSupportContactHref();
  const { t, tOr } = useI18n();
  const { openLink } = useOpenLink();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const legalQuickLinks = buildSupportLegalQuickLinks({ t, openLink });

  const openTelegramSupport = () => {
    if (supportHref) openLink(supportHref);
  };

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_title")}
        message={model.pageState.message ?? t("common.could_not_load_generic")}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageScaffold>
        <PageLayout scrollable={false}>
          <PageHeader
            backAriaLabel={t("common.back_aria")}
            title={model.header.title}
            subtitle={model.header.subtitle}
            onBack={() => navigate(-1)}
          />
          <Stack gap="2">
            <Skeleton variant="card" height={180} />
            <Skeleton variant="line" width="40%" />
            <SkeletonList lines={4} />
            <Skeleton variant="line" width="50%" />
            <Skeleton variant="card" height={120} />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  const supportStatus = supportHref ? "active" : "offline";
  const statusLabel = supportHref ? tOr("common.status_online", "Online") : tOr("common.status_offline", "Offline");

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
          {model.faqOffline ? (
            <InlineAlert
              variant="warning"
              label={t("support.faq_offline_title")}
              message={t("support.faq_offline_message")}
              action={{ label: t("common.retry"), onClick: () => void model.refetchFaq() }}
            />
          ) : null}
          {/* Contact Support */}
          <SectionLabel label={t("support.contact_card_title")} />
          <CardRow className="support-contact-card">
            <RowItem
              icon={<IconHelpCircle size={15} strokeWidth={2} aria-hidden />}
              iconVariant="neutral"
              label={model.hero.title}
              subtitle={getSupportCardDescription(t, model.hero.subtitle)}
              subtitleClassName="support-contact-sub"
              right={<StatusChip variant={supportStatus} label={statusLabel} />}
              showChevron={false}
            />
          </CardRow>
          {!supportHref && (
            <InlineAlert
              variant="warning"
              label={t("support.support_link_unavailable_title")}
              message={t("support.support_link_unavailable_message")}
            />
          )}

          {/* Common Fixes */}
          <SectionLabel label={t("support.quick_paths_title")} />
          <p className="section-desc">{t("support.quick_paths_description")}</p>
          <CardRow>
            <RowItem
              icon={<IconRotateCw size={15} strokeWidth={2} aria-hidden />}
              iconVariant="default"
              label={t("onboarding.restore_access")}
              subtitle={t("support.quick_paths_restore_description")}
              onClick={() => navigate("/restore-access")}
            />
            <RowItem
              icon={<IconMonitor size={15} strokeWidth={2} aria-hidden />}
              iconVariant="default"
              label={t("devices.header_title")}
              subtitle={t("support.quick_paths_devices_description")}
              onClick={() => navigate("/devices")}
            />
            <RowItem
              icon={<IconCreditCard size={15} strokeWidth={2} aria-hidden />}
              iconVariant="default"
              label={t("plan.header_title")}
              subtitle={t("support.quick_paths_plan_description")}
              onClick={() => navigate("/plan")}
            />
            {legalQuickLinks.map((link) => (
              <RowItem
                key={link.title}
                icon={<IconFileText size={15} strokeWidth={2} aria-hidden />}
                iconVariant="default"
                label={link.title}
                subtitle={link.subtitle}
                onClick={link.onClick}
              />
            ))}
            <RowItem
              icon={<IconMessageCircle size={15} strokeWidth={2} aria-hidden />}
              iconVariant="default"
              label={t("settings.contact_support_title")}
              subtitle={t("support.quick_paths_support_description")}
              onClick={supportHref ? openTelegramSupport : undefined}
            />
          </CardRow>

          {/* Troubleshooter */}
          <SectionLabel label={t("support.troubleshooter_title")} />
          <p className="section-desc">{t("support.troubleshooter_description_short")}</p>
          <TroubleshooterFlowCard
            eyebrow={t("support.troubleshooter_flow_label")}
            stepLabel={t("support.troubleshooter_step_chip", { index: model.step + 1, total: model.totalSteps })}
            title={model.currentStep.title}
            body={model.currentStep.body}
            altAction={
              model.currentStepAltLabel
                ? {
                    label: model.currentStepAltLabel,
                    onClick: () => navigate("/plan", { state: { fromSupport: true } }),
                  }
                : undefined
            }
            backAction={
              model.previousStep
                ? { label: model.currentStep.backLabel, onClick: model.previousStep }
                : undefined
            }
            nextAction={{ label: model.currentStep.nextLabel, onClick: model.nextStep }}
          />

          {/* FAQ */}
          <SectionLabel label={t("support.faq_title")} />
          <p className="section-desc">{t("support.faq_description")}</p>
          <div className="faq-list">
            {model.faqItems.map((item, index) => (
              <FaqDisclosureItem
                key={index}
                question={item.title}
                answer={item.body}
                isOpen={openFaq === index}
                onToggle={() => setOpenFaq((current) => (current === index ? null : index))}
              />
            ))}
          </div>
        </Stack>
        <FooterHelp
          note={t("footer.having_trouble")}
          linkLabel={t("footer.view_setup_guide")}
          onLinkClick={() => navigate("/setup-guide")}
        />
      </PageLayout>
    </PageScaffold>
  );
}
