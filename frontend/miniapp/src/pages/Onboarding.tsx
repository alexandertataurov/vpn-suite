import { useMemo, useState, type TouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconShield,
  IconSmartphone,
  IconGlobe,
  PageFrame,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionProgressBar,
  MissionSecondaryButton,
} from "@/design-system";
import { useBootstrapContext } from "@/bootstrap/BootstrapController";
import { useOpenLink } from "@/hooks/features/useOpenLink";
import appStoreBadgeUrl from "@/assets/badges/app-store-badge.svg";
import googlePlayBadgeUrl from "@/assets/badges/google-play-badge.png";

const IOS_APP_URL = "https://apps.apple.com/app/amneziavpn/id1600529900";
const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=org.amnezia.vpn";

const ONBOARDING_STEPS = [
  {
    id: "install",
    title: "Install AmneziaVPN",
    body: "Download the AmneziaVPN app from the App Store or Google Play.",
    cta: "Next",
    icon: IconSmartphone,
  },
  {
    id: "open",
    title: "Open AmneziaVPN",
    body: "Launch the app after installation. You will see the main connection screen.",
    cta: "Next",
    icon: IconShield,
  },
  {
    id: "import",
    title: "Add your VPN configuration",
    body: 'In AmneziaVPN tap "Add configuration" \u2192 Scan QR or Import config file.',
    cta: "Next",
    icon: IconGlobe,
  },
  {
    id: "scan",
    title: "Scan your personal QR code",
    body: "Use the scanner inside AmneziaVPN. Your connection will be added automatically.",
    cta: "Next",
    icon: IconSmartphone,
  },
  {
    id: "connect",
    title: "Tap Connect",
    body: "Enable the VPN connection. Status in AmneziaVPN should turn green.",
    cta: "Open dashboard",
    icon: IconShield,
  },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { openLink } = useOpenLink();
  const { onboardingStep, onboardingError, isCompletingOnboarding, setOnboardingStep, completeOnboarding } =
    useBootstrapContext();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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

  const handleBack = async () => {
    if (stepIndex <= 0 || isCompletingOnboarding || isAdvancing) return;
    setIsAdvancing(true);
    try {
      await setOnboardingStep(stepIndex - 1);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || isCompletingOnboarding || isAdvancing) return;
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null || isCompletingOnboarding || isAdvancing) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    const threshold = 40;
    if (deltaX <= -threshold && !isLastStep) {
      void handlePrimaryAction();
    } else if (deltaX >= threshold && stepIndex > 0) {
      void handleBack();
    }
    setTouchStartX(null);
  };

  return (
    <PageFrame title="Welcome">
      <PageSection>
        <MissionCard
          tone="blue"
          className="module-card onboarding-card"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <MissionModuleHead
            label={`Step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}`}
            chip={<MissionChip tone="neutral">Onboarding</MissionChip>}
          />
          <div className="onboarding-manual stack">
            <div className="onboarding-header">
              <div className="onboarding-title-row">
                <span className="onboarding-icon" aria-hidden>
                  <StepIcon size={20} strokeWidth={1.6} />
                </span>
                <h2 className="op-name type-h3">
                  {step.title}
                </h2>
              </div>
              <p className="op-desc type-body-sm">{step.body}</p>
            </div>

            <div className="onboarding-visual">
              {step.id === "install" ? (
                <div className="onboarding-store-visual">
                  <button
                    type="button"
                    className="store-badge-link"
                    aria-label="Get AmneziaVPN on the App Store"
                    onClick={() => openLink(IOS_APP_URL)}
                  >
                    <img src={appStoreBadgeUrl} alt="" className="store-badge store-badge--apple" />
                  </button>
                  <button
                    type="button"
                    className="store-badge-link"
                    aria-label="Get AmneziaVPN on Google Play"
                    onClick={() => openLink(ANDROID_APP_URL)}
                  >
                    <img src={googlePlayBadgeUrl} alt="" className="store-badge store-badge--google" />
                  </button>
                </div>
              ) : null}
              {step.id === "import" ? (
                <div className="onboarding-flow-diagram">
                  <span>AmneziaVPN app</span>
                  <span className="arrow">↓</span>
                  <span>Add configuration</span>
                  <span className="arrow">↓</span>
                  <span>Scan QR · or · Import file</span>
                </div>
              ) : null}
              {step.id === "scan" ? <div className="onboarding-qr-placeholder" aria-hidden /> : null}
              {step.id === "connect" ? (
                <div className="onboarding-status-legend" aria-label="Connection status examples">
                  <span>🟢 Connected</span>
                  <span>🟡 Connecting</span>
                  <span>🔴 Disconnected</span>
                </div>
              ) : null}
            </div>

            {onboardingError && (
              <MissionAlert tone="error" title="Could not continue" message={onboardingError} />
            )}

            <div className="onboarding-footer">
              <div className="btn-row">
                {stepIndex > 0 && (
                  <MissionSecondaryButton onClick={() => void handleBack()} disabled={isCompletingOnboarding || isAdvancing}>
                    Back
                  </MissionSecondaryButton>
                )}
                <MissionPrimaryButton
                  disabled={isCompletingOnboarding || isAdvancing}
                  onClick={() => void handlePrimaryAction()}
                >
                  {isCompletingOnboarding || isAdvancing ? (
                    <>
                      <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                        <path d="M20 12a8 8 0 0 0-8-8" />
                      </svg>
                      <span>Loading…</span>
                    </>
                  ) : (
                    step.cta
                  )}
                </MissionPrimaryButton>
              </div>
              <div className="onboarding-progress">
                <MissionProgressBar percent={progressValue} staticFill ariaLabel="Onboarding progress" />
                <div className="onboarding-dots" role="tablist" aria-label="Onboarding steps">
                  {ONBOARDING_STEPS.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`onboarding-dot${
                        index === stepIndex ? " onboarding-dot--active" : ""
                      }`}
                      role="tab"
                      aria-selected={index === stepIndex}
                      aria-current={index === stepIndex ? "step" : undefined}
                      aria-label={`Go to step ${index + 1}: ${item.title}`}
                      onClick={() => {
                        if (index === stepIndex || isCompletingOnboarding || isAdvancing) return;
                        void setOnboardingStep(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </MissionCard>
      </PageSection>
    </PageFrame>
  );
}
