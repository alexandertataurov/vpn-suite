import { useEffect, useState } from "react";
import { useWebappToken } from "@/api/client";
import { useSession, useTrackScreen, useTelemetry } from "@/hooks";
import type { StandardPageHeader, StandardPageState } from "./types";
import { getActiveSubscription } from "./helpers";
import { useI18n } from "@/hooks";

const TROUBLESHOOTER_STEPS = [
  {
    titleKey: "support.troubleshooter_step_access_title",
    bodyKey: "support.troubleshooter_step_access_body",
    nextLabelKey: "support.troubleshooter_step_access_next",
    backLabelKey: "onboarding.back",
  },
  {
    titleKey: "support.troubleshooter_step_device_title",
    bodyKey: "support.troubleshooter_step_device_body",
    nextLabelKey: "support.troubleshooter_step_device_next",
    backLabelKey: "onboarding.back",
  },
  {
    titleKey: "support.troubleshooter_step_refresh_title",
    bodyKey: "support.troubleshooter_step_refresh_body",
    nextLabelKey: "support.troubleshooter_step_refresh_next",
    backLabelKey: "onboarding.back",
  },
  {
    titleKey: "support.troubleshooter_step_support_title",
    bodyKey: "support.troubleshooter_step_support_body",
    nextLabelKey: "support.troubleshooter_step_support_next",
    backLabelKey: "onboarding.back",
  },
] as const;

export function useSupportPageModel() {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch } = useSession(hasToken);
  const activeSub = getActiveSubscription(data);
  useTrackScreen("support", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const [step, setStep] = useState(0);
  const totalSteps = TROUBLESHOOTER_STEPS.length;
  const { t } = useI18n();

  const header: StandardPageHeader = {
    title: t("support.header_title"),
    subtitle: t("support.header_subtitle"),
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : isLoading
      ? { status: "loading" }
      : error
      ? {
          status: "error",
          title: t("common.could_not_load_title"),
          message: t("common.could_not_load_generic"),
          onRetry: () => void refetch(),
        }
        : { status: "ready" };

  const hero = {
    eyebrow: t("support.header_title"),
    title: t("support.hero_title"),
    subtitle: t("support.hero_subtitle"),
    edge: "e-b" as const,
    glow: "g-blue" as const,
  };

  /** Only for step 0: label for the "No" path (e.g. navigate to plan). */
  const currentStepAltLabel =
    step === 0 ? t("support.troubleshooter_step_access_alt") : undefined;

  useEffect(() => {
    track("support_opened", { screen_name: "support" });
  }, [track]);

  return {
    header,
    pageState,
    hero,
    currentStep: {
      title: t(TROUBLESHOOTER_STEPS[step]?.titleKey ?? TROUBLESHOOTER_STEPS[0].titleKey),
      body: t(TROUBLESHOOTER_STEPS[step]?.bodyKey ?? TROUBLESHOOTER_STEPS[0].bodyKey),
      nextLabel: t(TROUBLESHOOTER_STEPS[step]?.nextLabelKey ?? TROUBLESHOOTER_STEPS[0].nextLabelKey),
      backLabel: t(TROUBLESHOOTER_STEPS[step]?.backLabelKey ?? TROUBLESHOOTER_STEPS[0].backLabelKey),
    },
    step,
    totalSteps,
    currentStepAltLabel,
    nextStep: () => setStep((value) => (value + 1 < totalSteps ? value + 1 : 0)),
    previousStep: step > 0 ? () => setStep((value) => value - 1) : undefined,
  };
}
