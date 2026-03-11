import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionMissing, SupportContactCard, TroubleshooterStep } from "@/components";
import {
  FallbackScreen,
  FaqDisclosureItem,
  PageFrame,
  PageSection,
  PageHeaderBadge,
  Skeleton,
  SupportActionList,
  IconCreditCard,
  IconRotateCw,
  IconServer,
} from "@/design-system";
import { useSupportPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";
import { telegramBotUsername } from "@/config/env";

export function SupportPage() {
  const navigate = useNavigate();
  const model = useSupportPageModel();
  const supportHref = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : null;
  const { t, tOr } = useI18n();
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
      <PageFrame title={model.header.title} className="page-shell--default page-shell--sectioned">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="page-shell--default page-shell--sectioned">
      <SupportContactCard
        title={model.hero.title}
        description={model.hero.subtitle ?? t("support.contact_card_description")}
        supportHref={supportHref}
      />
      <PageSection
        title={t("support.contact_card_title")}
        className="stagger-2"
      >
        <SupportActionList
          items={[
            {
              to: "/restore-access",
              title: t("onboarding.restore_access"),
              description: t("restore.info_message"),
              icon: <IconRotateCw size={18} strokeWidth={1.8} />,
            },
            {
              to: "/devices",
              title: t("devices.header_title"),
              description: t("devices.summary_subtitle_default"),
              icon: <IconServer size={18} strokeWidth={1.8} />,
              tone: "green",
            },
            {
              to: "/plan",
              title: t("plan.header_title"),
              description: t("plan.renewal_description_generic"),
              icon: <IconCreditCard size={18} strokeWidth={1.8} />,
              tone: "amber",
            },
          ]}
        />
      </PageSection>
      <PageSection
        title={t("support.troubleshooter_title")}
        description={t("support.troubleshooter_description")}
        className="stagger-3"
        action={
          <PageHeaderBadge
            tone="warning"
            label={tOr("support.troubleshooter_step_badge", String(model.troubleshooterBadge.label ?? ""), {
              index: model.step + 1,
              total: model.totalSteps,
            })}
          />
        }
      >
        <TroubleshooterStep
          stepIndex={model.step + 1}
          totalSteps={model.totalSteps}
          title={model.currentStep.title}
          body={model.currentStep.body}
          nextLabel={model.currentStep.nextLabel}
          onNext={model.nextStep}
          backLabel={model.currentStep.backLabel}
          onBack={model.previousStep ?? undefined}
          altLabel={model.currentStepAltLabel ?? undefined}
          onAlt={model.currentStepAltLabel ? () => navigate("/plan", { state: { fromSupport: true } }) : undefined}
        />
      </PageSection>
      <PageSection
        title={t("support.faq_title")}
        description={t("support.faq_description")}
        className="stagger-4"
      >
        <ul className="support-faq-list stagger-5" role="list">
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
    </PageFrame>
  );
}
