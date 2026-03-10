import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SummaryHero, SessionMissing, TroubleshooterStep } from "@/components";
import {
  FallbackScreen,
  PageFrame,
  PageCardSection,
  PageSection,
  Skeleton,
  MissionPrimaryAnchor,
} from "@/design-system";
import { useSupportPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";
import { telegramBotUsername } from "@/config/env";

interface SupportFaqItemProps {
  title: string;
  body: string;
  isOpen: boolean;
  onToggle: () => void;
}

function SupportFaqItem({ title, body, isOpen, onToggle }: SupportFaqItemProps) {
  const panelId = useId();
  const triggerId = `${panelId}-trigger`;

  return (
    <li className="support-faq-item">
      <button
        id={triggerId}
        type="button"
        className="support-faq-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="op-name type-h3">{title}</span>
        <span className="support-faq-symbol" aria-hidden>
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="support-faq-panel"
        hidden={!isOpen}
      >
        <p className="op-desc type-body-sm">{body}</p>
      </div>
    </li>
  );
}

export function SupportPage() {
  const navigate = useNavigate();
  const model = useSupportPageModel();
  const supportHref = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : null;
  const { t } = useI18n();
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
      <PageFrame title={model.header.title} className="support-page">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="support-page">
      <SummaryHero {...model.hero} className="stagger-1" />
      <PageCardSection
        title={t("support.contact_card_title")}
        cardTone={supportHref ? "green" : "amber"}
        className="stagger-2"
      >
        <div className="support-contact-stack">
          <p className="op-desc type-body-sm">{t("support.contact_card_description")}</p>
          {supportHref ? (
            <MissionPrimaryAnchor
              aria-label={t("support.contact_button_label")}
              href={supportHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("support.contact_button_label")}
            </MissionPrimaryAnchor>
          ) : (
            <div className="support-inline-note">
              <h3 className="op-name type-h3">{t("support.support_link_unavailable_title")}</h3>
              <p className="op-desc type-body-sm">
                {t("support.support_link_unavailable_message")}
              </p>
            </div>
          )}
        </div>
      </PageCardSection>
      <PageSection
        title={t("support.troubleshooter_title")}
        description={t("support.troubleshooter_description")}
        className="stagger-3"
      >
        <TroubleshooterStep
          stepIndex={model.step + 1}
          totalSteps={model.totalSteps}
          title={model.currentStep.title}
          body={model.currentStep.body}
          nextLabel={model.currentStep.nextLabel}
          onNext={model.nextStep}
          backLabel={model.currentStep.backLabel}
          onBack={model.previousStep}
          altLabel={model.currentStepAltLabel}
          onAlt={
            model.currentStepAltLabel
              ? () => navigate("/plan", { state: { fromSupport: true } })
              : undefined
          }
        />
      </PageSection>
      <PageSection
        title={t("support.faq_title")}
        description={t("support.faq_description")}
        className="stagger-4"
      >
        <ul className="support-faq-list stagger-5" role="list">
          {faqItems.map((item, index) => (
            <SupportFaqItem
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
