/**
 * Onboarding page — pre-app_ready flow.
 * No page-model: uses useBootstrapContext, useSession, webappApi directly.
 * Runs before app_ready; bootstrap owns auth/session. See page-models README for convention.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FooterHelp,
  PageHeader,
  PageLayout,
  PageScaffold,
  useToast,
} from "@/design-system";
import { ONBOARDING_STEPS, OnboardingStepCard } from "@/design-system/recipes";
import { useBootstrapContext } from "@/app/bootstrap/context";
import { webappApi } from "@/api/client";
import { useOpenLink, useSession, useTelemetry, useTelegramWebApp } from "@/hooks";
import { webappQueryKeys } from "@/lib";
import { getActiveDevices, getActiveOrGraceSubscription } from "@/page-models/helpers";
import { getSupportBotHref } from "@/config/env";
import { useI18n } from "@/hooks/useI18n";
import { AMNEZIA_VPN_ANDROID_URL, AMNEZIA_VPN_IOS_URL } from "@/lib";
import { buildGuidanceTelemetryContext, buildSupportContext, useGuidanceContextId } from "@/features/support/support-context";
import { telegramClient } from "@/lib/telegram/telegramCoreClient";

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
  const { t, locale } = useI18n();
  const guidanceContextId = useGuidanceContextId();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [appAlreadyInstalled, setAppAlreadyInstalled] = useState(false);
  const completedThisSessionRef = useRef(false);
  const lastStepIndexRef = useRef(0);
  const onboardingStartedTrackedRef = useRef(false);

  const stepIndex = useMemo(
    () => Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, onboardingStep)),
    [onboardingStep],
  );
  const step = ONBOARDING_STEPS[stepIndex]!;
  const platform = telegramClient.getPlatform();

  const buildGuidancePayload = useCallback(
    (lastAction: string, flowStepIndex: number, flowStepId: string) => {
      const context = buildSupportContext({
        session,
        currentRoute: "/onboarding",
        lastAction,
        platform,
        locale,
        guidanceContextId,
      });
      return buildGuidanceTelemetryContext(context, "onboarding", flowStepIndex, flowStepId);
    },
    [session, platform, locale, guidanceContextId],
  );

  // One-shot: fire when session first becomes available (not on every session object update)
  useEffect(() => {
    if (session == null || onboardingStartedTrackedRef.current) return;
    onboardingStartedTrackedRef.current = true;
    track("onboarding_started", {
      ...buildGuidancePayload("onboarding_started", 0, "intro"),
      step: 0,
      step_id: "intro",
    });
  }, [buildGuidancePayload, session, track]);

  useEffect(() => {
    track("onboarding_step_viewed", {
      ...buildGuidancePayload("onboarding_step_viewed", stepIndex, step.id),
    });
  }, [buildGuidancePayload, stepIndex, step.id, track]);

  lastStepIndexRef.current = stepIndex;

  useEffect(() => {
    return () => {
      if (completedThisSessionRef.current) return;
      const lastStep = lastStepIndexRef.current;
      const stepId = ONBOARDING_STEPS[Math.min(lastStep, ONBOARDING_STEPS.length - 1)]?.id;
      if (stepId) {
        track("onboarding_abandoned", {
          ...buildGuidancePayload("onboarding_abandoned", lastStep, stepId),
        });
      }
    };
  }, [buildGuidancePayload, track]);

  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;
  const activeDevices = useMemo(() => getActiveDevices(session), [session]);
  const hasActiveDevice = activeDevices.length > 0;
  const hasActivePlan = Boolean(getActiveOrGraceSubscription(session));
  const hasDetectedActivity = Boolean(session?.public_ip || activeDevices.some((d) => d.last_seen_handshake_at));
  const launchPayload = session?.latest_device_delivery?.amnezia_vpn_key ?? null;

  const botAppLink = getSupportBotHref() ?? "";

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
      track("onboarding_step_completed", {
        ...buildGuidancePayload("onboarding_step_completed", stepIndex, step.id),
      });
      await setOnboardingStep(nextStep);
    },
    [buildGuidancePayload, setOnboardingStep, step.id, stepIndex, track],
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
        if (!hasActivePlan) {
          navigate("/plan", { state: { fromOnboarding: true } });
        }
      });
      return;
    }

    if (step.id === "get_config") {
      if (!hasActivePlan) {
        navigate("/plan", { state: { fromOnboarding: true } });
        return;
      }

      if (!hasActiveDevice) {
        navigate("/devices", { state: { fromOnboarding: true } });
        return;
      }

      await withAdvance(async () => {
        await goToStep(3);
      });
      return;
    }

    if (step.id === "open_vpn") {
      if (!hasActiveDevice) {
        navigate("/devices", { state: { fromOnboarding: true } });
        return;
      }

      if (!hasDetectedActivity && launchPayload) {
        openLink(launchPayload);
      }
      
      await withAdvance(async () => {
        await goToStep(4);
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
    hasActivePlan,
    isInsideTelegram,
    launchPayload,
    navigate,
    openLink,
    step.id,
    hasDetectedActivity,
    withAdvance,
    t,
  ]);

  const handleSkipForNow = useCallback(async () => {
    completedThisSessionRef.current = true;
    const result = await completeOnboarding();
    if (result?.done) {
      if (!result.synced) {
        addToast(t("onboarding.progress_saved_local"), "info");
      }
      if (botAppLink && !isInsideTelegram) openLink(botAppLink);
    }
  }, [addToast, botAppLink, completeOnboarding, isInsideTelegram, openLink, t]);

  useEffect(() => {
    if (step.id === "get_config" && hasActivePlan && hasActiveDevice && !isAdvancing) {
      void goToStep(3);
    }
  }, [step.id, hasActivePlan, hasActiveDevice, goToStep, isAdvancing]);

  const handleBack = useCallback(async () => {
    if (stepIndex <= 0) return;
    await withAdvance(async () => {
      await setOnboardingStep(stepIndex - 1);
    });
  }, [setOnboardingStep, stepIndex, withAdvance]);


  const pageTitle = t("onboarding.page_title");
  const pageSubtitle =
    stepIndex === 0
      ? t("onboarding.page_subtitle_intro")
      : step.id === "install_app"
        ? t("onboarding.page_subtitle_install")
        : step.id === "get_config"
          ? t("onboarding.page_subtitle_get_config")
          : t("onboarding.page_subtitle_confirm");

  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        onBack={stepIndex > 0 ? () => void handleBack() : undefined}
        backAriaLabel={t("common.back_aria")}
      />
      <OnboardingStepCard
        step={step}
        onboardingError={onboardingError}
        appAlreadyInstalled={appAlreadyInstalled}
        onOpenIos={() => openLink(AMNEZIA_VPN_IOS_URL)}
        onOpenAndroid={() => openLink(AMNEZIA_VPN_ANDROID_URL)}
        onMarkInstalled={() => setAppAlreadyInstalled(true)}
        onPrimaryAction={() => void handlePrimaryAction()}
        isBusy={isCompletingOnboarding || isAdvancing}
        hasActivePlan={hasActivePlan}
        hasActiveDevice={hasActiveDevice}
        hasDetectedActivity={hasDetectedActivity}
        detectedIp={session?.public_ip}
      />

      {(isLastStep || !hasActivePlan) && (
        <FooterHelp
          note=""
          linkLabel={t("onboarding.skip_for_now")}
          onLinkClick={() => void handleSkipForNow()}
        />
      )}
      </PageLayout>
    </PageScaffold>
  );
}
