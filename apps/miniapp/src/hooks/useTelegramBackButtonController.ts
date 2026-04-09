import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useBackButton } from "./controls/useBackButton";
import type { BootPhase } from "../bootstrap/useBootstrapMachine";

interface UseTelegramBackButtonControllerOptions {
  phase: BootPhase;
  onboardingStep: number;
  onOnboardingBack: () => void;
}

export function useTelegramBackButtonController({
  phase,
  onboardingStep,
  onOnboardingBack,
}: UseTelegramBackButtonControllerOptions) {
  const location = useLocation();
  const backButton = useBackButton();

  useEffect(() => {
    // In-app HeaderZone owns the left navigation slot.
    // Keep Telegram BackButton hidden to avoid duplicated back/close controls.
    backButton.hide();
  }, [backButton, location.pathname, onOnboardingBack, onboardingStep, phase]);
}
