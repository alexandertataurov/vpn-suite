import { useNavigate } from "react-router-dom";
import { SummaryHero, SessionMissing, TroubleshooterStep } from "@/components";
import {
  FallbackScreen,
  PageFrame,
  PageSection,
  Skeleton,
  MissionCard,
  MissionChip,
  MissionPrimaryAnchor,
  SupportActionList,
  IconShield,
  IconCreditCard,
  IconSmartphone,
} from "@/design-system";
import { useSupportPageModel } from "@/page-models";
import { telegramBotUsername } from "@/config/env";

export function SupportPage() {
  const navigate = useNavigate();
  const model = useSupportPageModel();
  const supportHref = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : "https://t.me/real_person_0";

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load"}
        message={model.pageState.message ?? "We could not load your session. Tap Try again to reload."}
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
    <PageFrame title={model.header.title} className="support-page">
      <SummaryHero {...model.hero} className="stagger-1" />
      <PageSection
        title="Troubleshooter"
        action={<MissionChip tone={model.troubleshooterBadge.tone} className="section-meta-chip miniapp-tnum">{model.troubleshooterBadge.label}</MissionChip>}
        description="Most issues can be fixed in under a minute. Follow the steps before opening support chat."
        className="stagger-2"
      >
        <TroubleshooterStep
          stepIndex={model.step + 1}
          totalSteps={model.totalSteps}
          title={model.currentStep.title}
          body={model.currentStep.body}
          nextLabel={model.currentStep.nextLabel}
          onNext={model.nextStep}
          backLabel={model.previousStep ? model.currentStep.backLabel : undefined}
          onBack={model.previousStep}
          altLabel={model.currentStepAltLabel}
          onAlt={model.currentStepAltLabel ? () => navigate("/plan") : undefined}
        />
      </PageSection>
      <PageSection
        title="Quick fixes"
        description="Jump to common support flows."
        className="stagger-3"
      >
        <SupportActionList
          items={[
            { to: "/restore-access", title: "Restore VPN access", description: "Download a new config", tone: "amber", icon: <IconShield size={20} strokeWidth={1.6} /> },
            { to: "/plan", title: "Plans & billing", description: "Subscription, renewal, payment", tone: "green", icon: <IconCreditCard size={20} strokeWidth={1.6} /> },
            { to: "/devices", title: "Devices", description: "Add or remove VPN devices", tone: "blue", icon: <IconSmartphone size={20} strokeWidth={1.6} /> },
          ]}
        />
      </PageSection>
      <PageSection
        title="FAQ"
        description="Short answers to the questions users hit most often."
        className="stagger-6"
      >
        <div className="faq-grid stagger-7">
          <MissionCard tone="blue" className="module-card module-card--tight">
            <h3 className="op-name type-h3">VPN not connecting</h3>
            <p className="op-desc type-body-sm">
              Run the steps above, then check Devices and Restore access.
            </p>
          </MissionCard>
          <MissionCard tone="blue" className="module-card module-card--tight">
            <h3 className="op-name type-h3">Installation</h3>
            <p className="op-desc type-body-sm">
              Subscribe, add a device, download the config, then import it in AmneziaVPN.
            </p>
          </MissionCard>
          <MissionCard tone="blue" className="module-card module-card--tight">
            <h3 className="op-name type-h3">Privacy and security</h3>
            <p className="op-desc type-body-sm">
              Treat each config as a secret. If it leaks, revoke the device and issue a new one.
            </p>
          </MissionCard>
        </div>
      </PageSection>
      <PageSection title="Still need help?" className="stagger-8">
        <MissionPrimaryAnchor
          aria-label="Contact support"
          href={supportHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact support
        </MissionPrimaryAnchor>
      </PageSection>
    </PageFrame>
  );
}
