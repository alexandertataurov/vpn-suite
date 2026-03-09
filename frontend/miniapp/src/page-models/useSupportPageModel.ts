import { useState } from "react";
import { useWebappToken } from "@/api/client";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import { getActiveSubscription } from "./helpers";

const TROUBLESHOOTER_STEPS = [
  {
    title: "Is your subscription active?",
    body: "Check Home or Plan. If there is no active plan, choose one and complete payment.",
    nextLabel: "Yes, my subscription is active",
    backLabel: "Back",
  },
  {
    title: "Do you have a device config?",
    body: "Go to Devices, add a device, and import the config into AmneziaVPN or a compatible app.",
    nextLabel: "I have a config",
    backLabel: "Back",
  },
  {
    title: "Try reissuing the config",
    body: "In Devices, revoke the device and add it again to get a fresh config.",
    nextLabel: "Next",
    backLabel: "Back",
  },
  {
    title: "Contact support",
    body: "If it still does not connect, open support chat from this page.",
    nextLabel: "Done",
    backLabel: "Back",
  },
] as const;

export function useSupportPageModel() {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch } = useSession(hasToken);
  const activeSub = getActiveSubscription(data);
  useTrackScreen("support", activeSub?.plan_id ?? null);
  const [step, setStep] = useState(0);
  const totalSteps = TROUBLESHOOTER_STEPS.length;
  const current = TROUBLESHOOTER_STEPS[step] ?? TROUBLESHOOTER_STEPS[0];

  const header: StandardPageHeader = {
    title: "Support",
    subtitle: "Fix connection issues quickly",
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : isLoading
      ? { status: "loading" }
      : error
        ? {
            status: "error",
            title: "Could not load",
            message: "We could not load your session. Tap Try again to reload.",
            onRetry: () => void refetch(),
          }
        : { status: "ready" };

  const hero = {
    eyebrow: "Network status",
    title: "All systems operational",
    subtitle: "No known service incidents",
    edge: "e-g" as const,
    glow: "g-green" as const,
  };

  const troubleshooterBadge: StandardSectionBadge = {
    tone: "neutral",
    label: `Step ${step + 1}/${totalSteps}`,
    emphasizeNumeric: true,
  };

  /** Only for step 0: label for the "No" path (e.g. navigate to plan). */
  const currentStepAltLabel = step === 0 ? "No, choose plan" : undefined;

  return {
    header,
    pageState,
    hero,
    currentStep: current,
    step,
    totalSteps,
    troubleshooterBadge,
    currentStepAltLabel,
    nextStep: () => setStep((value) => (value + 1 < totalSteps ? value + 1 : 0)),
    previousStep: step > 0 ? () => setStep((value) => value - 1) : undefined,
  };
}
