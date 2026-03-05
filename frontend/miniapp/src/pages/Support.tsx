import { useState } from "react";
import { getButtonClassName, PageFrame, PageSection, Panel, Skeleton } from "../ui";
import { TroubleshooterStep, FallbackScreen, SessionMissing } from "@/components";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useSession } from "../hooks/useSession";
import { useWebappToken } from "../api/client";

const TROUBLESHOOTER_STEPS = [
  {
    title: "Is your subscription active?",
    body: "Check the Home or Plan tab. If you have no active plan, choose a plan and complete payment.",
    nextLabel: "Yes, it's active",
    backLabel: "Back",
  },
  {
    title: "Do you have a device config?",
    body: "Go to Devices and add a device to get a config. Install it in AmneziaVPN or a compatible app.",
    nextLabel: "I have a config",
    backLabel: "Back",
  },
  {
    title: "Try reissuing the config",
    body: "In Devices, revoke the device and add it again to get a fresh config. Sometimes the server was updated.",
    nextLabel: "Next",
    backLabel: "Back",
  },
  {
    title: "Contact support",
    body: "If you still can't connect, contact support via the VPN bot or the official support channel.",
    nextLabel: "Done",
    backLabel: "Back",
  },
];

export function SupportPage() {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch } = useSession(hasToken);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  useTrackScreen("support", activeSub?.plan_id ?? null);

  const [step, setStep] = useState(0);
  const totalSteps = TROUBLESHOOTER_STEPS.length;
  const current = (TROUBLESHOOTER_STEPS[step] ?? TROUBLESHOOTER_STEPS[0])!;

  if (!hasToken) {
    return <SessionMissing />;
  }

  if (isLoading) {
    return (
      <PageFrame title="Support Console" subtitle="Troubleshooting and help">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <FallbackScreen
        title="Could not load"
        message="We could not load your session. Tap Try again to reload."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <PageFrame title="Support Console" subtitle="Troubleshooting and help">

      <PageSection
        title="DIAGNOSTIC FLOW"
        description="Follow the flow to fix common connection issues."
        action={<span className="chip cn section-meta-chip">STEP {step + 1}/{totalSteps}</span>}
      >
        <TroubleshooterStep
          stepIndex={step + 1}
          totalSteps={totalSteps}
          title={current.title}
          body={current.body}
          nextLabel={current.nextLabel}
          onNext={() => setStep((s) => (s + 1 < totalSteps ? s + 1 : 0))}
          backLabel={step > 0 ? current.backLabel : undefined}
          onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
        />
      </PageSection>

      <PageSection title="OPERATOR FAQ" description="High-value quick answers.">
        <div className="faq-grid">
          <Panel className="card edge et module-card module-card--tight">
            <h3 className="type-h4">INSTALLATION</h3>
            <p className="type-body-sm">
              Subscribe to a plan, add a device, download the config, then import it in AmneziaVPN.
            </p>
          </Panel>
          <Panel className="card edge et module-card module-card--tight">
            <h3 className="type-h4">PRIVACY & SECURITY</h3>
            <p className="type-body-sm">
              Treat each config as a secret. If compromised, revoke the device in Devices and issue a new one.
            </p>
          </Panel>
        </div>
      </PageSection>

      <a aria-label="Contact support" href="https://t.me/support" target="_blank" rel="noopener noreferrer"
        className={getButtonClassName("primary", "lg", "btn-full-width")}
      >
        Contact support
      </a>
    </PageFrame>
  );
}
