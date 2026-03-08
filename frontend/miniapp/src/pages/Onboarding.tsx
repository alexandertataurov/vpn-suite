import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import {
  IconShield,
  IconSmartphone,
  IconGlobe,
  PageFrame,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionProgressBar,
  MissionPrimaryLink,
  MissionSecondaryButton,
  MissionSecondaryLink,
  useToast,
} from "@/design-system";
import { useBootstrapContext } from "@/bootstrap/BootstrapController";
import { webappApi } from "@/api/client";
import { useOpenLink } from "@/hooks/features/useOpenLink";
import { useSession } from "@/hooks/useSession";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { getActiveDevices } from "@/page-models";
import { useQueryClient } from "@tanstack/react-query";
import appStoreBadgeUrl from "@/assets/badges/app-store-badge.svg";
import googlePlayBadgeUrl from "@/assets/badges/google-play-badge.png";

const IOS_APP_URL = "https://apps.apple.com/app/amneziavpn/id1600529900";
const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=org.amnezia.vpn";

export type OnboardingPlatform = "ios" | "android" | "other";

// 3 outcome-based steps per spec §8.2
const ONBOARDING_STEPS = [
  {
    id: "choose_device",
    title: "Install AmneziaVPN",
    body: "Download the app for your device. Tap your store below, then return here.",
    cta: "Next",
    icon: IconSmartphone,
  },
  {
    id: "get_config",
    title: "Get your config",
    body: "Subscribe to a plan if needed, then open Devices in this app and tap Issue device. You get a one-time config — copy or download the .conf file. In AmneziaVPN: Add configuration → Import file (use the .conf) or paste the copied text. Store the config carefully; it may only appear once.",
    bodyAlreadyInstalled: "Subscribe if needed, then open Devices here and tap Issue device. Copy or download the config, then in AmneziaVPN: Add configuration → Import file or paste. Store it carefully; it may only appear once.",
    cta: "Next",
    icon: IconGlobe,
  },
  {
    id: "confirm_connected",
    title: "Confirm connected",
    body: "Once the VPN is connected, confirm here.",
    cta: "I'm connected",
    icon: IconShield,
  },
] as const;

const PLATFORM_LABELS: Record<OnboardingPlatform, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  other: "Other device",
};

export function OnboardingPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession(true);
  const { track } = useTelemetry(null);
  const { openLink } = useOpenLink();
  const { isInsideTelegram } = useTelegramWebApp();
  const { onboardingStep, onboardingError, isCompletingOnboarding, setOnboardingStep, completeOnboarding } =
    useBootstrapContext();
  const { addToast } = useToast();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<OnboardingPlatform | null>(null);
  const [appAlreadyInstalled, setAppAlreadyInstalled] = useState(false);
  const completedThisSessionRef = useRef(false);
  const lastStepIndexRef = useRef(0);

  const user = session?.user ?? null;
  const displayName = (user?.display_name ?? "").trim() || "there";
  const photoUrl = (user?.photo_url ?? "").trim() || undefined;

  const stepIndex = useMemo(
    () => Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, onboardingStep)),
    [onboardingStep],
  );
  const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];

  // Funnel: onboarding_started (once), onboarding_step_viewed (per step)
  useEffect(() => {
    if (session == null) return;
    track("onboarding_started", {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fire once on mount
  useEffect(() => {
    track("onboarding_step_viewed", { step: stepIndex, step_id: step.id });
  }, [stepIndex, step.id, track]);

  lastStepIndexRef.current = stepIndex;

  useEffect(() => {
    return () => {
      if (completedThisSessionRef.current) return;
      const lastStep = lastStepIndexRef.current;
      const stepId = ONBOARDING_STEPS[Math.min(lastStep, ONBOARDING_STEPS.length - 1)]?.id;
      track("onboarding_abandoned", { step: lastStep, step_id: stepId });
    };
  }, [track]);

  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;
  const activeDevices = useMemo(() => getActiveDevices(session), [session]);
  const hasActiveDevice = activeDevices.length > 0;
  const progressValue = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;
  const StepIcon = step.icon;

  const step2Body = useMemo(() => {
    if (step.id !== "get_config") return step.body;
    if (appAlreadyInstalled && "bodyAlreadyInstalled" in step) {
      return (step as (typeof ONBOARDING_STEPS)[1]).bodyAlreadyInstalled;
    }
    const platformHint =
      selectedPlatform === "ios"
        ? "On iPhone or iPad: "
        : selectedPlatform === "android"
          ? "On Android: "
          : "";
    return platformHint ? `${platformHint}${step.body}` : step.body;
  }, [step, selectedPlatform, appAlreadyInstalled]);

  const botUsername =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: { VITE_TELEGRAM_BOT_USERNAME?: string } }).env?.VITE_TELEGRAM_BOT_USERNAME ?? ""
      : "";
  const botAppLink = botUsername ? `https://t.me/${botUsername}` : "";

  const confirmConnected = useCallback(async (): Promise<boolean> => {
    const devices = getActiveDevices(session);
    const device = devices[0];
    if (!device) return false;
    try {
      await webappApi.post(`/webapp/devices/${device.id}/confirm-connected`);
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      return true;
    } catch {
      return false;
    }
  }, [session, queryClient]);

  const handlePrimaryAction = async () => {
    if (isLastStep) {
      completedThisSessionRef.current = true;
      if (hasActiveDevice) {
        await confirmConnected();
      }
      const result = await completeOnboarding();
      if (result?.done) {
        if (!result.synced) {
          addToast("Progress saved locally; we'll sync when back online.", "info");
        }
        if (botAppLink && !isInsideTelegram) openLink(botAppLink);
      }
      return;
    }
    setIsAdvancing(true);
    try {
      track("onboarding_step_completed", { step: stepIndex });
      await setOnboardingStep(stepIndex + 1);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSkipForNow = async () => {
    if (!isLastStep) return;
    completedThisSessionRef.current = true;
    const result = await completeOnboarding();
    if (result?.done) {
      if (!result.synced) {
        addToast("Progress saved locally; we'll sync when back online.", "info");
      }
      if (botAppLink && !isInsideTelegram) openLink(botAppLink);
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
        <div className="onboarding-greeting">
          <div className="onboarding-greeting-avatar" aria-hidden>
            {photoUrl ? (
              <img src={photoUrl} alt="" className="onboarding-greeting-avatar-img" />
            ) : (
              <span className="onboarding-greeting-initial">
                {displayName !== "there" ? displayName.charAt(0).toUpperCase() : "?"}
              </span>
            )}
          </div>
          <h1 className="onboarding-greeting-title">
            Hello, {displayName}!
          </h1>
          <p className="onboarding-greeting-desc">
            Welcome to our VPN service. Follow the steps below to get connected.
          </p>
        </div>
        <MissionCard
          tone="blue"
          className="module-card onboarding-card"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <MissionModuleHead
            label={`Step ${stepIndex + 1} of ${ONBOARDING_STEPS.length}`}
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
              <p className="op-desc type-body-sm">
                {step.id === "get_config" ? step2Body : step.body}
              </p>
            </div>

            <div className="onboarding-visual">
              {step.id === "choose_device" ? (
                <div className="onboarding-store-visual">
                  {selectedPlatform == null ? (
                    <div className="onboarding-platform-choice" role="group" aria-label="Choose your device type">
                      {(["ios", "android", "other"] as const).map((p) => (
                        <MissionSecondaryButton
                          key={p}
                          type="button"
                          onClick={() => setSelectedPlatform(p)}
                          aria-pressed={selectedPlatform === p}
                        >
                          {PLATFORM_LABELS[p]}
                        </MissionSecondaryButton>
                      ))}
                    </div>
                  ) : null}
                  {selectedPlatform === "ios" || selectedPlatform === "other" ? (
                    <button
                      type="button"
                      className="store-badge-link"
                      aria-label="Get AmneziaVPN on the App Store"
                      onClick={() => openLink(IOS_APP_URL)}
                    >
                      <img src={appStoreBadgeUrl} alt="" className="store-badge store-badge--apple" />
                    </button>
                  ) : null}
                  {selectedPlatform === "android" || selectedPlatform === "other" ? (
                    <button
                      type="button"
                      className="store-badge-link"
                      aria-label="Get AmneziaVPN on Google Play"
                      onClick={() => openLink(ANDROID_APP_URL)}
                    >
                      <img src={googlePlayBadgeUrl} alt="" className="store-badge store-badge--google" />
                    </button>
                  ) : null}
                </div>
              ) : null}
              {step.id === "get_config" ? (
                <>
                  {!appAlreadyInstalled && (
                    <MissionSecondaryButton
                      type="button"
                      onClick={() => setAppAlreadyInstalled(true)}
                      className="onboarding-already-installed"
                    >
                      I already have AmneziaVPN
                    </MissionSecondaryButton>
                  )}
                  <div className="onboarding-flow-diagram">
                    <span>This app: Plan → Devices → Issue device</span>
                    <span className="arrow">↓</span>
                    <span>Copy config or download .conf</span>
                    <span className="arrow">↓</span>
                    <span>AmneziaVPN: Add configuration → Import file or paste</span>
                  </div>
                  <div className="btn-row">
                    <MissionSecondaryLink to="/plan" state={{ fromOnboarding: true }}>
                      Choose plan
                    </MissionSecondaryLink>
                    <MissionSecondaryLink to="/devices" state={{ fromOnboarding: true }}>
                      Go to Devices
                    </MissionSecondaryLink>
                  </div>
                </>
              ) : null}
              {step.id === "confirm_connected" ? (
                <>
                  {!hasActiveDevice && (
                    <MissionAlert
                      tone="warning"
                      title="Get your config first"
                      message="Subscribe if needed, then open Devices and issue a device. After you import the config and connect, return here to confirm."
                    />
                  )}
                  {hasActiveDevice &&
                    (session?.public_ip ||
                      activeDevices.some((d) => d.last_seen_handshake_at)) && (
                    <MissionAlert
                      tone="success"
                      title="We see your connection"
                      message={
                        session?.public_ip
                          ? `Your VPN IP: ${session.public_ip}. Tap "I'm connected" below to finish.`
                          : "Connection detected. Tap \"I'm connected\" below to finish."
                      }
                    />
                  )}
                  <div className="onboarding-status-legend" aria-label="Connection status examples">
                    <span>🟢 Connected</span>
                    <span>🟡 Connecting</span>
                    <span>🔴 Disconnected</span>
                  </div>
                </>
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
                {isLastStep && !hasActiveDevice ? (
                  <>
                    <MissionPrimaryLink to="/devices" state={{ fromOnboarding: true }}>
                      Get your config first
                    </MissionPrimaryLink>
                    <MissionSecondaryButton
                      disabled={isCompletingOnboarding || isAdvancing}
                      onClick={() => void handleSkipForNow()}
                    >
                      Skip for now
                    </MissionSecondaryButton>
                  </>
                ) : (
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
                )}
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
