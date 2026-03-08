import {
  PageCardSection,
  PageFrame,
  PageSection,
  Skeleton,
  SummaryHero,
  MissionCard,
  MissionChip,
  MissionPrimaryAnchor,
  SessionMissing,
  TroubleshooterStep,
} from "@/design-system";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import { useSupportPageModel } from "@/page-models";

export function SupportPage() {
  const model = useSupportPageModel();
  const botUsername =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: { VITE_TELEGRAM_BOT_USERNAME?: string } }).env?.VITE_TELEGRAM_BOT_USERNAME ?? ""
      : "";
  const supportHref = botUsername ? `https://t.me/${botUsername}` : "https://t.me/real_person_0";

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
      <PageCardSection
        title="Troubleshooter"
        action={<MissionChip tone={model.troubleshooterBadge.tone} className="section-meta-chip miniapp-tnum">{model.troubleshooterBadge.label}</MissionChip>}
        description="Follow the steps before opening chat. They resolve the most common setup and connection issues."
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
        />
      </PageCardSection>
      <PageSection
        title="FAQ"
        description="Short answers to the questions users hit most often."
        className="stagger-4"
      >
        <div className="faq-grid stagger-5">
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
      <MissionPrimaryAnchor
        aria-label="Contact support"
        href={supportHref}
        target="_blank"
        rel="noopener noreferrer"
        className="stagger-6"
      >
        Contact support
      </MissionPrimaryAnchor>
    </PageFrame>
  );
}
