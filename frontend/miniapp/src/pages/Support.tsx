import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionMissing, SupportContactCard, TroubleshooterStep } from "@/components";
import { useOpenLink } from "@/hooks";
import { IconCreditCard, IconHelpCircle, IconRotateCw, IconServer } from "@/design-system/icons";
import {
  FaqDisclosureItem,
  FallbackScreen,
  Skeleton,
  SkeletonList,
  PageScaffold,
  ModernHeader,
  PageSection,
  SettingsActionRow,
} from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { useSupportPageModel } from "@/page-models";
import { useI18n } from "@/hooks";
import { getSupportBotHref } from "@/config/env";

export function SupportPage() {
  const navigate = useNavigate();
  const model = useSupportPageModel();
  const supportHref = getSupportBotHref();
  const { t } = useI18n();
  const { openLink } = useOpenLink();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      title: t("support.faq_item_connection_title"),
      body: t("support.faq_item_connection_body"),
    },
    {
      title: t("support.faq_item_install_title"),
      body: t("support.faq_item_install_body"),
    },
    {
      title: t("support.faq_item_restore_title"),
      body: t("support.faq_item_restore_body"),
    },
    {
      title: t("support.faq_item_device_title"),
      body: t("support.faq_item_device_body"),
    },
    {
      title: t("support.faq_item_billing_title"),
      body: t("support.faq_item_billing_body"),
    },
    {
      title: t("support.faq_item_privacy_title"),
      body: t("support.faq_item_privacy_body"),
    },
    {
      title: t("support.faq_item_support_title"),
      body: t("support.faq_item_support_body"),
    },
    {
      title: t("support.faq_item_slow_title"),
      body: t("support.faq_item_slow_body"),
    },
    {
      title: t("support.faq_item_cancel_title"),
      body: t("support.faq_item_cancel_body"),
    },
    {
      title: t("support.faq_item_data_title"),
      body: t("support.faq_item_data_body"),
    },
  ];

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
        <ModernHeader title={model.header.title} showSettings={false} />
        <Stack gap="4">
          <Skeleton variant="card" height={180} />
          <Skeleton variant="line" width="40%" />
          <SkeletonList lines={4} />
          <Skeleton variant="line" width="50%" />
          <Skeleton variant="card" height={120} />
        </Stack>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <ModernHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        showSettings={false}
        onBack={() => navigate(-1)}
      />
      <Stack gap="4">
        <SupportContactCard
          title={model.hero.title}
          description={model.hero.subtitle ?? t("support.contact_card_description")}
          supportHref={supportHref}
        />

        <PageSection
          title={t("support.quick_paths_title")}
          description={t("support.quick_paths_description")}
        >
          <ul className="modern-list">
            <SettingsActionRow
            icon={<IconRotateCw size={18} strokeWidth={2} />}
            title={t("onboarding.restore_access")}
            description={t("support.quick_paths_restore_description")}
            tone="blue"
            onClick={() => navigate("/restore-access")}
          />
          <SettingsActionRow
            icon={<IconServer size={18} strokeWidth={2} />}
            title={t("devices.header_title")}
            description={t("support.quick_paths_devices_description")}
            tone="green"
            onClick={() => navigate("/devices")}
          />
          <SettingsActionRow
            icon={<IconCreditCard size={18} strokeWidth={2} />}
            title={t("plan.header_title")}
            description={t("support.quick_paths_plan_description")}
            tone="amber"
            onClick={() => navigate("/plan")}
          />
          <SettingsActionRow
            icon={<IconHelpCircle size={18} strokeWidth={2} />}
            title={t("settings.contact_support_title")}
            description={t("support.quick_paths_support_description")}
            tone="blue"
            actionIndicator="external"
            onClick={() => {
              if (supportHref) {
                openLink(supportHref);
              }
            }}
            buttonProps={{ disabled: !supportHref }}
          />
          </ul>
        </PageSection>

        <PageSection
          title={t("support.troubleshooter_title")}
          description={t("support.troubleshooter_description_short")}
        >
          <TroubleshooterStep
          key={model.step}
          stepIndex={model.step + 1}
          totalSteps={model.totalSteps}
          title={model.currentStep.title}
          body={model.currentStep.body}
          nextLabel={model.currentStep.nextLabel}
          onNext={model.nextStep}
          altLabel={model.currentStepAltLabel ?? undefined}
          onAlt={model.currentStepAltLabel ? () => navigate("/plan", { state: { fromSupport: true } }) : undefined}
        />
        </PageSection>

        <PageSection
          title={t("support.faq_title")}
          description={t("support.faq_description")}
        >
          <ul className="modern-list">
            {faqItems.map((item, index) => (
            <FaqDisclosureItem
              key={item.title}
              title={item.title}
              body={item.body}
              isOpen={openFaq === index}
              onToggle={() => setOpenFaq((current) => (current === index ? null : index))}
            />
            ))}
          </ul>
        </PageSection>
      </Stack>
    </PageScaffold>
  );
}
