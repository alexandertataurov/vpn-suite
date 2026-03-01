import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Smartphone, Globe } from "lucide-react";
import {
  Button,
  InlineAlert,
  PageScaffold,
  PageHeader,
  PageSection,
  Panel,
  ProgressBar,
  H2,
  Body,
  ActionRow,
} from "../ui";
import { useBootstrapContext } from "../bootstrap/BootstrapController";

const ONBOARDING_STEPS = [
  {
    title: "Private by default",
    body: "Your traffic is encrypted end-to-end so public Wi-Fi and mobile networks stay safe.",
    cta: "Continue",
    icon: Shield,
  },
  {
    title: "Connect every device",
    body: "Add your phone, tablet, or laptop in minutes and keep all your sessions protected.",
    cta: "Continue",
    icon: Smartphone,
  },
  {
    title: "Choose your plan",
    body: "Pick the plan that matches your usage and start secure browsing immediately.",
    cta: "Go to plans",
    icon: Globe,
  },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const {
    onboardingStep,
    onboardingError,
    isCompletingOnboarding,
    setOnboardingStep,
    completeOnboarding,
  } = useBootstrapContext();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const stepIndex = useMemo(
    () => Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, onboardingStep)),
    [onboardingStep],
  );
  const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;
  const progressValue = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;
  const StepIcon = step.icon;

  const handlePrimaryAction = async () => {
    if (isLastStep) {
      const done = await completeOnboarding();
      if (done) {
        navigate("/plan", { replace: true });
      }
      return;
    }
    setIsAdvancing(true);
    try {
      await setOnboardingStep(stepIndex + 1);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <PageScaffold className="onboarding-screen">
      <PageHeader title="Welcome" subtitle={`Step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}`} />
      <PageSection>
        <Panel className="card instrument-card instrument-card--active onboarding-card">
          <span className="onboarding-icon" aria-hidden>
            <StepIcon size={28} strokeWidth={1.5} />
          </span>
          <H2 as="h2" className="onboarding-title">
            {step.title}
          </H2>
          <Body className="onboarding-body">{step.body}</Body>
          <ProgressBar value={progressValue} max={100} className="onboarding-progress" />
          {onboardingError && (
            <InlineAlert
              variant="error"
              title="Could not continue"
              message={onboardingError}
            />
          )}
          <ActionRow fullWidth>
            <Button
              variant="primary"
              size="lg"
              className="splash-screen-cta"
              loading={isCompletingOnboarding || isAdvancing}
              disabled={isCompletingOnboarding || isAdvancing}
              onClick={handlePrimaryAction}
            >
              {step.cta}
            </Button>
          </ActionRow>
        </Panel>
      </PageSection>
    </PageScaffold>
  );
}
