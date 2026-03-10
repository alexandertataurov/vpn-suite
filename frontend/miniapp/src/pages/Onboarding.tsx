/**
 * Onboarding page — pre-app_ready flow.
 * No page-model: uses useBootstrapContext, useSession, webappApi directly.
 * Runs before app_ready; bootstrap owns auth/session. See page-models README for convention.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconDownload,
  IconGlobe,
  IconShield,
  PageFrame,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryButton,
  MissionSecondaryLink,
  StickyBottomBar,
  Button,
  ButtonRow,
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
import { useNavigate } from "react-router-dom";
import appStoreBadgeUrl from "@/assets/badges/app-store-badge.svg";
import googlePlayBadgeUrl from "@/assets/badges/google-play-badge.png";
import { telegramBotUsername } from "@/config/env";
import { useI18n } from "@/hooks/useI18n";

const IOS_APP_URL = "https://apps.apple.com/app/amneziavpn/id1600529900";
const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=org.amnezia.vpn";

const ONBOARDING_STEPS = [
  {
    id: "intro",
    titleKey: "onboarding.step_intro_title",
    bodyKey: "onboarding.step_intro_body",
    ctaKey: "onboarding.step_intro_cta",
    icon: IconShield,
  },
  {
    id: "install_app",
    titleKey: "onboarding.step_install_title",
    bodyKey: "onboarding.step_install_body",
    ctaKey: "onboarding.step_install_cta",
    icon: IconGlobe,
  },
  {
    id: "get_config",
    titleKey: "onboarding.step_get_config_title",
    bodyKey: "onboarding.step_get_config_body",
    ctaKey: "onboarding.choose_plan",
    icon: IconDownload,
  },
  {
    id: "confirm_connected",
    titleKey: "onboarding.step_confirm_title",
    bodyKey: "onboarding.step_confirm_body",
    ctaKey: "onboarding.step_confirm_primary",
    icon: IconGlobe,
  },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession(true);
  const { track } = useTelemetry(null);
  const { openLink } = useOpenLink();
  const { isInsideTelegram } = useTelegramWebApp();
  const { onboardingStep, onboardingError, isCompletingOnboarding, setOnboardingStep, completeOnboarding } =
    useBootstrapContext();
  const { addToast } = useToast();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [appAlreadyInstalled, setAppAlreadyInstalled] = useState(false);
  const completedThisSessionRef = useRef(false);
  const lastStepIndexRef = useRef(0);

  const user = session?.user ?? null;
  const displayName = (user?.display_name ?? "").trim() || "there";

  const stepIndex = useMemo(
    () => Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, onboardingStep)),
    [onboardingStep],
  );
  const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const StepIcon = step.icon;

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
  const isConfigStep = step.id === "get_config";

  const botAppLink = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : "";

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

  const withAdvance = useCallback(
    async (action: () => Promise<void>) => {
      if (isCompletingOnboarding || isAdvancing) return;
      setIsAdvancing(true);
      try {
        await action();
      } finally {
        setIsAdvancing(false);
      }
    },
    [isAdvancing, isCompletingOnboarding],
  );

  const goToStep = useCallback(
    async (nextStep: number) => {
      track("onboarding_step_completed", { step: stepIndex });
      await setOnboardingStep(nextStep);
    },
    [setOnboardingStep, stepIndex, track],
  );

  const handlePrimaryAction = useCallback(async () => {
    if (step.id === "intro") {
      await withAdvance(async () => {
        await goToStep(1);
      });
      return;
    }

    if (step.id === "install_app") {
      await withAdvance(async () => {
        await goToStep(2);
      });
      return;
    }

    if (step.id === "get_config") {
      await withAdvance(async () => {
        await goToStep(3);
        navigate("/plan", { state: { fromOnboarding: true } });
      });
      return;
    }

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
  }, [
    addToast,
    botAppLink,
    completeOnboarding,
    confirmConnected,
    goToStep,
    hasActiveDevice,
    isInsideTelegram,
    navigate,
    openLink,
    step.id,
    withAdvance,
  ]);

  const handleSkipForNow = useCallback(async () => {
    if (!isLastStep) return;
    completedThisSessionRef.current = true;
    const result = await completeOnboarding();
    if (result?.done) {
      if (!result.synced) {
        addToast("Progress saved locally; we'll sync when back online.", "info");
      }
      if (botAppLink && !isInsideTelegram) openLink(botAppLink);
    }
  }, [addToast, botAppLink, completeOnboarding, isInsideTelegram, isLastStep, openLink]);

  const handleBack = useCallback(async () => {
    if (stepIndex <= 0) return;
    await withAdvance(async () => {
      await setOnboardingStep(stepIndex - 1);
    });
  }, [setOnboardingStep, stepIndex, withAdvance]);

  const handleChoosePlan = useCallback(async () => {
    await withAdvance(async () => {
      await goToStep(3);
      navigate("/plan", { state: { fromOnboarding: true } });
    });
  }, [goToStep, navigate, withAdvance]);
  const { t } = useI18n();

  const pageTitle = t("onboarding.page_title");
  const pageSubtitle =
    stepIndex === 0
      ? t("onboarding.page_subtitle_intro", {
          comma_name: displayName === "there" ? "" : `, ${displayName}`,
        })
      : step.id === "install_app"
        ? t("onboarding.page_subtitle_install")
      : step.id === "get_config"
        ? t("onboarding.page_subtitle_get_config")
        : t("onboarding.page_subtitle_confirm");

  return (
    <PageFrame
      title={pageTitle}
      subtitle={pageSubtitle}
      className="onboarding-page"
      hideTrailingAction
    >
      <PageSection>
        <MissionCard tone="blue" className="module-card onboarding-task-card">
          <MissionModuleHead
            label={t("onboarding.store_step_label", {
              current: stepIndex + 1,
              total: ONBOARDING_STEPS.length,
            })}
          />
          <div className="onboarding-task-stack">
            <div className="onboarding-task-header">
              <div className="onboarding-task-title-row">
                <span className="onboarding-task-icon" aria-hidden>
                  <StepIcon size={18} strokeWidth={1.8} />
                </span>
                <h2 className="op-name type-h3">{t(step.titleKey)}</h2>
              </div>
              <p className="op-desc type-body-sm">{t(step.bodyKey)}</p>
            </div>

            <div className="onboarding-setup-card">
              <div className="onboarding-setup-head">
                <h3 className="type-h2 onboarding-setup-title">{t("onboarding.setup_sequence_title")}</h3>
                <p className="type-body onboarding-setup-summary">{t("onboarding.setup_sequence_summary")}</p>
              </div>

              <ol className="onboarding-progress-strip" aria-label={t("onboarding.steps_label")}>
                {ONBOARDING_STEPS.map((item, index) => {
                  const status =
                    index < stepIndex ? "done" : index === stepIndex ? "current" : "upcoming";

                  return (
                    <li
                      key={item.id}
                      className={`onboarding-progress-step onboarding-progress-step--${status}`}
                    >
                      <span className="onboarding-progress-index" aria-hidden>
                        {index + 1}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {step.id === "intro" ? (
                <>
                  <div className="onboarding-clean-block">
                    <div className="onboarding-clean-head">
                      <span className="onboarding-clean-index" aria-hidden>
                        1
                      </span>
                      <div className="onboarding-clean-copy">
                        <p className="type-h2 onboarding-clean-title">
                          {t("onboarding.step_intro_title")}
                        </p>
                        <p className="type-body onboarding-clean-body">
                          {t("onboarding.step_intro_body")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <MissionAlert
                    tone="info"
                    title={t("onboarding.connection_boundary_title")}
                    message={t("onboarding.connection_boundary_message")}
                  />
                </>
              ) : null}

              {step.id === "install_app" ? (
                <div className="onboarding-clean-block">
                  <div className="onboarding-clean-head">
                      <span className="onboarding-clean-index" aria-hidden>
                        2
                      </span>
                      <div className="onboarding-clean-copy">
                        <p className="type-h2 onboarding-clean-title">
                          {t("onboarding.config_step_install_title")}
                        </p>
                        <p className="type-body onboarding-clean-body">
                          {appAlreadyInstalled
                            ? t("onboarding.install_copy_ready")
                            : t("onboarding.config_step_install_body")}
                      </p>
                    </div>
                  </div>

                  {!appAlreadyInstalled ? (
                    <div className="onboarding-install-panel">
                      <div className="onboarding-store-badges">
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          className="store-badge-link"
                          aria-label={t("onboarding.appstore_aria")}
                          onClick={() => openLink(IOS_APP_URL)}
                        >
                          <img src={appStoreBadgeUrl} alt="" className="store-badge store-badge--apple" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          className="store-badge-link"
                          aria-label={t("onboarding.play_aria")}
                          onClick={() => openLink(ANDROID_APP_URL)}
                        >
                          <img src={googlePlayBadgeUrl} alt="" className="store-badge store-badge--google" />
                        </Button>
                      </div>

                      <MissionSecondaryButton
                        type="button"
                        onClick={() => setAppAlreadyInstalled(true)}
                        className="onboarding-already-installed"
                      >
                        {t("onboarding.already_installed")}
                      </MissionSecondaryButton>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step.id === "get_config" ? (
                <>
                  <div className="onboarding-clean-block">
                    <div className="onboarding-clean-head">
                      <span className="onboarding-clean-index" aria-hidden>
                        3
                      </span>
                      <div className="onboarding-clean-copy">
                        <p className="type-h2 onboarding-clean-title">
                          {t("onboarding.config_step_issue_title")}
                        </p>
                        <p className="type-body onboarding-clean-body">
                          {t("onboarding.config_step_issue_body")}
                        </p>
                      </div>
                    </div>

                    <div className="onboarding-inline-note">{t("onboarding.issue_note")}</div>
                  </div>

                  <ButtonRow>
                    <MissionPrimaryButton
                      disabled={isCompletingOnboarding || isAdvancing}
                      onClick={() => void handleChoosePlan()}
                    >
                      {isCompletingOnboarding || isAdvancing
                        ? t("onboarding.loading")
                        : t("onboarding.choose_plan")}
                    </MissionPrimaryButton>
                    <MissionSecondaryLink to="/devices" state={{ fromOnboarding: true }}>
                      {t("onboarding.go_to_devices")}
                    </MissionSecondaryLink>
                  </ButtonRow>
                </>
              ) : null}

              {step.id === "confirm_connected" ? (
                <>
                  <div className="onboarding-clean-block">
                    <div className="onboarding-clean-head">
                      <span className="onboarding-clean-index" aria-hidden>
                        4
                      </span>
                      <div className="onboarding-clean-copy">
                        <p className="type-h2 onboarding-clean-title">
                          {t("onboarding.step_confirm_title")}
                        </p>
                        <p className="type-body onboarding-clean-body">
                          {t("onboarding.step_confirm_body")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!hasActiveDevice ? (
                    <MissionAlert
                      tone="warning"
                      title={t("onboarding.get_config_first")}
                      message={t("onboarding.get_config_first_body")}
                    />
                  ) : null}

                  {hasActiveDevice && (session?.public_ip || activeDevices.some((d) => d.last_seen_handshake_at)) ? (
                    <MissionAlert
                      tone="success"
                      title={t("onboarding.setup_activity_detected_title")}
                      message={
                        session?.public_ip
                          ? t("onboarding.setup_activity_detected_message_with_ip", {
                              ip: session.public_ip,
                            })
                          : t("onboarding.setup_activity_detected_message_generic")
                      }
                    />
                  ) : null}

                  <MissionAlert
                    tone="info"
                    title={t("onboarding.what_happens_next_title")}
                    message={t("onboarding.what_happens_next_message")}
                  />
                </>
              ) : null}
            </div>
          </div>
        </MissionCard>

        {onboardingError ? (
          <MissionAlert
            tone="error"
            title={t("onboarding.could_not_continue_title")}
            message={onboardingError}
          />
        ) : null}
      </PageSection>

      <StickyBottomBar>
        <div className="onboarding-cta-stack">
          {stepIndex > 0 ? (
            <MissionSecondaryButton onClick={() => void handleBack()} disabled={isCompletingOnboarding || isAdvancing}>
              {t("onboarding.back")}
            </MissionSecondaryButton>
          ) : null}

          {isLastStep && !hasActiveDevice ? (
            <>
              <MissionPrimaryLink to="/devices" state={{ fromOnboarding: true }}>
                {t("onboarding.get_config_first")}
              </MissionPrimaryLink>
              <MissionSecondaryButton
                disabled={isCompletingOnboarding || isAdvancing}
                onClick={() => void handleSkipForNow()}
              >
                {t("onboarding.skip_for_now")}
              </MissionSecondaryButton>
            </>
          ) : !isConfigStep ? (
            <>
              <MissionPrimaryButton
                disabled={isCompletingOnboarding || isAdvancing}
                onClick={() => void handlePrimaryAction()}
              >
                {isCompletingOnboarding || isAdvancing
                  ? t("onboarding.loading")
                  : step.id === "confirm_connected"
                    ? t("onboarding.step_confirm_primary")
                    : t(step.ctaKey)}
              </MissionPrimaryButton>
              {stepIndex === 0 ? (
                <MissionSecondaryLink to="/restore-access">
                  {t("onboarding.restore_access")}
                </MissionSecondaryLink>
              ) : null}
            </>
          ) : null}
        </div>
      </StickyBottomBar>
    </PageFrame>
  );
}
