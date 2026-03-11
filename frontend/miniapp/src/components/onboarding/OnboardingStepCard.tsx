import type { ReactNode } from "react";
import appStoreBadgeUrl from "@/assets/badges/app-store-badge.svg";
import googlePlayBadgeUrl from "@/assets/badges/google-play-badge.png";
import {
  Button,
  ButtonRow,
  MissionAlert,
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionSecondaryLink,
  PageCardSection,
  PageHeaderBadge,
  type IconType,
} from "@/design-system";
import { IconDownload, IconGlobe, IconShield } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export type OnboardingStepId = "intro" | "install_app" | "get_config" | "confirm_connected";

export interface OnboardingStepDefinition {
  id: OnboardingStepId;
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
  icon: IconType;
}

export const ONBOARDING_STEPS: readonly OnboardingStepDefinition[] = [
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

export interface OnboardingStepCardProps {
  stepIndex: number;
  step: OnboardingStepDefinition;
  onboardingError?: string | null;
  appAlreadyInstalled: boolean;
  onOpenIos: () => void;
  onOpenAndroid: () => void;
  onMarkInstalled: () => void;
  onChoosePlan: () => void;
  choosePlanDisabled: boolean;
  choosePlanLoadingLabel: string;
  choosePlanLabel: string;
  hasActiveDevice: boolean;
  hasDetectedActivity: boolean;
  detectedIp?: string | null;
}

function OnboardingProgressStrip({ stepIndex }: { stepIndex: number }) {
  const { t } = useI18n();

  return (
    <ol className="onboarding-progress-strip" aria-label={t("onboarding.steps_label")}>
      {ONBOARDING_STEPS.map((item, index) => {
        const status = index < stepIndex ? "done" : index === stepIndex ? "current" : "upcoming";

        return (
          <li key={item.id} className={`onboarding-progress-step onboarding-progress-step--${status}`}>
            <span className="onboarding-progress-index" aria-hidden>
              {index + 1}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OnboardingCleanBlock({
  index,
  title,
  body,
  children,
}: {
  index: number;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="onboarding-clean-block">
      <div className="onboarding-clean-head">
        <span className="onboarding-clean-index" aria-hidden>
          {index}
        </span>
        <div className="onboarding-clean-copy">
          <p className="type-h2 onboarding-clean-title">{title}</p>
          <p className="type-body onboarding-clean-body">{body}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface OnboardingStepBodyProps {
  stepId: OnboardingStepId;
  appAlreadyInstalled: boolean;
  onOpenIos: () => void;
  onOpenAndroid: () => void;
  onMarkInstalled: () => void;
  onChoosePlan: () => void;
  choosePlanDisabled: boolean;
  choosePlanLoadingLabel: string;
  choosePlanLabel: string;
  hasActiveDevice: boolean;
  hasDetectedActivity: boolean;
  detectedIp?: string | null;
}

function OnboardingStepBody({
  stepId,
  appAlreadyInstalled,
  onOpenIos,
  onOpenAndroid,
  onMarkInstalled,
  onChoosePlan,
  choosePlanDisabled,
  choosePlanLoadingLabel,
  choosePlanLabel,
  hasActiveDevice,
  hasDetectedActivity,
  detectedIp,
}: OnboardingStepBodyProps) {
  const { t } = useI18n();

  if (stepId === "intro") {
    return (
      <>
        <OnboardingCleanBlock
          index={1}
          title={t("onboarding.step_intro_title")}
          body={t("onboarding.step_intro_body")}
        />
        <MissionAlert
          tone="info"
          title={t("onboarding.connection_boundary_title")}
          message={t("onboarding.connection_boundary_message")}
        />
      </>
    );
  }

  if (stepId === "install_app") {
    return (
      <OnboardingCleanBlock
        index={2}
        title={t("onboarding.config_step_install_title")}
        body={appAlreadyInstalled ? t("onboarding.install_copy_ready") : t("onboarding.config_step_install_body")}
      >
        {!appAlreadyInstalled ? (
          <div className="onboarding-install-panel">
            <div className="onboarding-store-badges">
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="store-badge-link"
                aria-label={t("onboarding.appstore_aria")}
                onClick={onOpenIos}
              >
                <img src={appStoreBadgeUrl} alt="" className="store-badge store-badge--apple" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="store-badge-link"
                aria-label={t("onboarding.play_aria")}
                onClick={onOpenAndroid}
              >
                <img src={googlePlayBadgeUrl} alt="" className="store-badge store-badge--google" />
              </Button>
            </div>

            <MissionSecondaryButton type="button" onClick={onMarkInstalled} className="onboarding-already-installed">
              {t("onboarding.already_installed")}
            </MissionSecondaryButton>
          </div>
        ) : null}
      </OnboardingCleanBlock>
    );
  }

  if (stepId === "get_config") {
    return (
      <>
        <OnboardingCleanBlock
          index={3}
          title={t("onboarding.config_step_issue_title")}
          body={t("onboarding.config_step_issue_body")}
        >
          <div className="onboarding-inline-note">{t("onboarding.issue_note")}</div>
        </OnboardingCleanBlock>

        <ButtonRow>
          <MissionPrimaryButton disabled={choosePlanDisabled} onClick={onChoosePlan}>
            {choosePlanDisabled ? choosePlanLoadingLabel : choosePlanLabel}
          </MissionPrimaryButton>
          <MissionSecondaryLink to="/devices" state={{ fromOnboarding: true }}>
            {t("onboarding.go_to_devices")}
          </MissionSecondaryLink>
        </ButtonRow>
      </>
    );
  }

  return (
    <>
      <OnboardingCleanBlock
        index={4}
        title={t("onboarding.step_confirm_title")}
        body={t("onboarding.step_confirm_body")}
      />

      {!hasActiveDevice ? (
        <MissionAlert
          tone="warning"
          title={t("onboarding.get_config_first")}
          message={t("onboarding.get_config_first_body")}
        />
      ) : null}

      {hasActiveDevice && hasDetectedActivity ? (
        <MissionAlert
          tone="success"
          title={t("onboarding.setup_activity_detected_title")}
          message={
            detectedIp
              ? t("onboarding.setup_activity_detected_message_with_ip", { ip: detectedIp })
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
  );
}

export function OnboardingStepCard({
  stepIndex,
  step,
  onboardingError,
  appAlreadyInstalled,
  onOpenIos,
  onOpenAndroid,
  onMarkInstalled,
  onChoosePlan,
  choosePlanDisabled,
  choosePlanLoadingLabel,
  choosePlanLabel,
  hasActiveDevice,
  hasDetectedActivity,
  detectedIp,
}: OnboardingStepCardProps) {
  const { t } = useI18n();
  const StepIcon = step.icon;

  return (
    <PageCardSection
      action={
        <PageHeaderBadge
          tone="info"
          label={t("onboarding.store_step_label", {
            current: stepIndex + 1,
            total: ONBOARDING_STEPS.length,
          })}
        />
      }
      cardClassName="module-card onboarding-task-card"
    >
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

          <OnboardingProgressStrip stepIndex={stepIndex} />

          <OnboardingStepBody
            stepId={step.id}
            appAlreadyInstalled={appAlreadyInstalled}
            onOpenIos={onOpenIos}
            onOpenAndroid={onOpenAndroid}
            onMarkInstalled={onMarkInstalled}
            onChoosePlan={onChoosePlan}
            choosePlanDisabled={choosePlanDisabled}
            choosePlanLoadingLabel={choosePlanLoadingLabel}
            choosePlanLabel={choosePlanLabel}
            hasActiveDevice={hasActiveDevice}
            hasDetectedActivity={hasDetectedActivity}
            detectedIp={detectedIp}
          />
        </div>
      </div>

      {onboardingError ? (
        <MissionAlert
          tone="error"
          title={t("onboarding.could_not_continue_title")}
          message={onboardingError}
        />
      ) : null}
    </PageCardSection>
  );
}
