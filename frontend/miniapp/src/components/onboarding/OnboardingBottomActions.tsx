import { MissionPrimaryButton, MissionPrimaryLink, MissionSecondaryButton, MissionSecondaryLink, StickyBottomBar } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
import type { OnboardingStepDefinition } from "./OnboardingStepCard";

export interface OnboardingBottomActionsProps {
  stepIndex: number;
  step: OnboardingStepDefinition;
  isLastStep: boolean;
  isConfigStep: boolean;
  hasActiveDevice: boolean;
  isBusy: boolean;
  onBack: () => void;
  onPrimaryAction: () => void;
  onSkipForNow: () => void;
}

export function OnboardingBottomActions({
  stepIndex,
  step,
  isLastStep,
  isConfigStep,
  hasActiveDevice,
  isBusy,
  onBack,
  onPrimaryAction,
  onSkipForNow,
}: OnboardingBottomActionsProps) {
  const { t } = useI18n();

  return (
    <StickyBottomBar>
      <div className="onboarding-cta-stack">
        {stepIndex > 0 ? (
          <MissionSecondaryButton onClick={onBack} disabled={isBusy}>
            {t("onboarding.back")}
          </MissionSecondaryButton>
        ) : null}

        {isLastStep && !hasActiveDevice ? (
          <>
            <MissionPrimaryLink to="/devices" state={{ fromOnboarding: true }}>
              {t("onboarding.get_config_first")}
            </MissionPrimaryLink>
            <MissionSecondaryButton disabled={isBusy} onClick={onSkipForNow}>
              {t("onboarding.skip_for_now")}
            </MissionSecondaryButton>
          </>
        ) : !isConfigStep ? (
          <>
            <MissionPrimaryButton disabled={isBusy} onClick={onPrimaryAction}>
              {isBusy
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
  );
}
