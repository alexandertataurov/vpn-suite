/**
 * Onboarding page — pre-app_ready flow.
 * No page-model: uses useBootstrapContext, useSession, webappApi directly.
 * Runs before app_ready; bootstrap owns auth/session. See page-models README for convention.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { OnboardingBottomActions, ONBOARDING_STEPS, OnboardingStepCard } from "@/components";
import { useToast } from "@/design-system";
import { PageFrame } from "@/design-system/layouts/PageFrame";
import { useBootstrapContext } from "@/bootstrap/BootstrapController";
import { webappApi } from "@/api/client";
import { useOpenLink } from "@/hooks/features/useOpenLink";
import { useSession } from "@/hooks/useSession";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { getActiveDevices } from "@/page-models";
import { telegramBotUsername } from "@/config/env";
import { useI18n } from "@/hooks/useI18n";

const IOS_APP_URL = "https://apps.apple.com/app/amneziavpn/id1600529900";
const ANDROID_APP_URL = "https://play.google.com/store/apps/details?id=org.amnezia.vpn";

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
  const { t } = useI18n();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [appAlreadyInstalled, setAppAlreadyInstalled] = useState(false);
  const completedThisSessionRef = useRef(false);
  const lastStepIndexRef = useRef(0);

  const user = session?.user ?? null;
  const displayName = (user?.display_name ?? "").trim() || t("onboarding.guest_name");

  const stepIndex = useMemo(
    () => Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, onboardingStep)),
    [onboardingStep],
  );
  const step = ONBOARDING_STEPS[stepIndex]!;

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
        addToast(t("onboarding.progress_saved_local"), "info");
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
    t,
  ]);

  const handleSkipForNow = useCallback(async () => {
    if (!isLastStep) return;
    completedThisSessionRef.current = true;
    const result = await completeOnboarding();
    if (result?.done) {
      if (!result.synced) {
        addToast(t("onboarding.progress_saved_local"), "info");
      }
      if (botAppLink && !isInsideTelegram) openLink(botAppLink);
    }
  }, [addToast, botAppLink, completeOnboarding, isInsideTelegram, isLastStep, openLink, t]);

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
  const pageTitle = t("onboarding.page_title");
  const pageSubtitle =
    stepIndex === 0
      ? t("onboarding.page_subtitle_intro", {
          comma_name: displayName === t("onboarding.guest_name") ? "" : `, ${displayName}`,
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
      <OnboardingStepCard
        stepIndex={stepIndex}
        step={step}
        onboardingError={onboardingError}
        appAlreadyInstalled={appAlreadyInstalled}
        onOpenIos={() => openLink(IOS_APP_URL)}
        onOpenAndroid={() => openLink(ANDROID_APP_URL)}
        onMarkInstalled={() => setAppAlreadyInstalled(true)}
        onChoosePlan={() => void handleChoosePlan()}
        choosePlanDisabled={isCompletingOnboarding || isAdvancing}
        choosePlanLoadingLabel={t("onboarding.loading")}
        choosePlanLabel={t("onboarding.choose_plan")}
        hasActiveDevice={hasActiveDevice}
        hasDetectedActivity={Boolean(session?.public_ip || activeDevices.some((d) => d.last_seen_handshake_at))}
        detectedIp={session?.public_ip}
      />

      <OnboardingBottomActions
        stepIndex={stepIndex}
        step={step}
        isLastStep={isLastStep}
        isConfigStep={isConfigStep}
        hasActiveDevice={hasActiveDevice}
        isBusy={isCompletingOnboarding || isAdvancing}
        onBack={() => void handleBack()}
        onPrimaryAction={() => void handlePrimaryAction()}
        onSkipForNow={() => void handleSkipForNow()}
      />
    </PageFrame>
  );
}
