import appStoreBadgeUrl from "@/assets/badges/app-store-badge.svg";
import googlePlayBadgeUrl from "@/assets/badges/google-play-badge.png";
import { Button, InlineAlert } from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconExternalLink,
  IconSettings,
  IconShield,
  type IconType,
} from "@/design-system/icons";
import { useI18n } from "@/hooks/useI18n";
import { ModernHeroCard } from "../home/ModernHeroCard";
import { VpnBoundaryNote } from "../shared/VpnBoundaryNote";

export type OnboardingStepId = "intro" | "install_app" | "get_config" | "open_vpn" | "confirm_connected";

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
    icon: IconDownload,
  },
  {
    id: "get_config",
    titleKey: "onboarding.step_get_config_title",
    bodyKey: "onboarding.step_get_config_body",
    ctaKey: "onboarding.choose_plan",
    icon: IconSettings,
  },
  {
    id: "open_vpn",
    titleKey: "onboarding.open_amneziavpn",
    bodyKey: "onboarding.confirm_open_app_note",
    ctaKey: "onboarding.open_amneziavpn",
    icon: IconExternalLink,
  },
  {
    id: "confirm_connected",
    titleKey: "onboarding.step_confirm_title",
    bodyKey: "onboarding.what_happens_next_message",
    ctaKey: "onboarding.step_confirm_primary",
    icon: IconCheck,
  },
] as const;

export interface OnboardingStepCardProps {
  step: OnboardingStepDefinition;
  onboardingError?: string | null;
  appAlreadyInstalled: boolean;
  onOpenIos: () => void;
  onOpenAndroid: () => void;
  onMarkInstalled: () => void;
  onPrimaryAction: () => void;
  isBusy: boolean;
  hasActivePlan: boolean;
  hasActiveDevice: boolean;
  hasDetectedActivity: boolean;
  detectedIp?: string | null;
}

export function OnboardingStepCard({
  step,
  onboardingError,
  appAlreadyInstalled,
  onOpenIos,
  onOpenAndroid,
  onMarkInstalled,
  onPrimaryAction,
  isBusy,
  hasActivePlan,
  hasActiveDevice,
  hasDetectedActivity,
  detectedIp,
}: OnboardingStepCardProps) {
  const { t } = useI18n();

  const primaryLabel =
    step.id === "intro"
      ? t("onboarding.step_intro_cta")
      : step.id === "install_app"
        ? appAlreadyInstalled ? t("onboarding.continue") : t("onboarding.step_install_cta")
        : step.id === "get_config"
          ? hasActivePlan
            ? t("onboarding.go_to_devices")
            : t("onboarding.choose_plan")
          : step.id === "open_vpn"
            ? t("onboarding.open_amneziavpn")
            : t("onboarding.step_confirm_primary");

  const renderStepContent = () => {
    switch (step.id) {
      case "intro":
        return (
          <ModernHeroCard
            status="default"
            icon={<IconShield size={36} />}
            title={t("onboarding.intro_panel_title")}
            description={t("onboarding.intro_panel_body")}
            actions={
              <Button variant="primary" fullWidth size="lg" onClick={onPrimaryAction} disabled={isBusy} endIcon={<IconArrowRight size={20} />}>
                {primaryLabel}
              </Button>
            }
          />
        );

      case "install_app":
        return (
          <ModernHeroCard
            status={appAlreadyInstalled ? "active" : "default"}
            icon={<IconDownload size={36} />}
            title={t("onboarding.config_step_install_title")}
            description={appAlreadyInstalled ? t("onboarding.install_copy_ready") : t("onboarding.config_step_install_body")}
            actions={
              <Stack gap="3">
                {!appAlreadyInstalled ? (
                  <>
                    <div className="ds-action-grid">
                      <Button variant="secondary" onClick={onOpenIos} aria-label={t("onboarding.download_ios")} className="store-badge-btn">
                        <img src={appStoreBadgeUrl} alt="" className="store-badge-img" />
                      </Button>
                      <Button variant="secondary" onClick={onOpenAndroid} aria-label={t("onboarding.download_android")} className="store-badge-btn">
                        <img src={googlePlayBadgeUrl} alt="" className="store-badge-img" />
                      </Button>
                    </div>
                    <Button variant="ghost" onClick={onMarkInstalled}>
                      {t("onboarding.already_installed")}
                    </Button>
                    <Button variant="primary" fullWidth size="lg" onClick={onPrimaryAction} disabled={isBusy} endIcon={<IconArrowRight size={20} />}>
                      {primaryLabel}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" tone="success" fullWidth size="lg" onClick={onPrimaryAction} disabled={isBusy} endIcon={<IconArrowRight size={20} />}>
                    {primaryLabel}
                  </Button>
                )}
              </Stack>
            }
          />
        );

      case "get_config":
        return (
          <ModernHeroCard
            status={hasActivePlan ? "active" : "default"}
            icon={<IconSettings size={36} />}
            title={hasActivePlan ? t("onboarding.config_ready_panel_title") : t("onboarding.step_get_config_title")}
            description={hasActivePlan ? t("onboarding.config_ready_panel_body") : t("onboarding.step_get_config_body")}
            actions={
              <Button variant="primary" tone={hasActivePlan ? "success" : "default"} fullWidth size="lg" onClick={onPrimaryAction} disabled={isBusy} endIcon={<IconArrowRight size={20} />}>
                {primaryLabel}
              </Button>
            }
          />
        );

      case "open_vpn":
        return (
          <ModernHeroCard
            status="active"
            icon={<IconExternalLink size={36} />}
            title={t("onboarding.open_amneziavpn")}
            description={t("onboarding.confirm_open_app_note")}
            actions={
              <Button variant="primary" tone="success" fullWidth size="lg" onClick={onPrimaryAction} disabled={isBusy} endIcon={<IconExternalLink size={20} />}>
                {primaryLabel}
              </Button>
            }
          />
        );

      case "confirm_connected":
        return (
          <ModernHeroCard
            status={hasDetectedActivity ? "active" : hasActiveDevice ? "warning" : "danger"}
            icon={<IconCheck size={36} />}
            title={t("onboarding.confirm_panel_title")}
            description={t("onboarding.step_confirm_body")}
            actions={
              <Stack gap="3">
                <Button variant="primary" tone="success" fullWidth size="lg" onClick={onPrimaryAction} disabled={isBusy} endIcon={<IconCheck size={20} />}>
                  {primaryLabel}
                </Button>
                {!hasActiveDevice ? (
                  <InlineAlert variant="warning" label={t("onboarding.get_config_first")} message={t("onboarding.get_config_first_body")} />
                ) : hasDetectedActivity ? (
                  <InlineAlert variant="success" label={t("onboarding.setup_activity_detected_title")} message={detectedIp ? t("onboarding.setup_activity_detected_message_with_ip", { ip: detectedIp }) : t("onboarding.setup_activity_detected_message_generic")} />
                ) : (
                  <InlineAlert variant="info" label={t("onboarding.what_happens_next_title")} message={t("onboarding.what_happens_next_message")} />
                )}
              </Stack>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Stack gap="4">
      {renderStepContent()}

      <div>
        <VpnBoundaryNote
          titleKey={step.id === "get_config" && hasActivePlan ? "onboarding.add_device_note_title" : "onboarding.connection_boundary_title"}
          messageKey={step.id === "get_config" && hasActivePlan ? "onboarding.issue_note" : "onboarding.connection_boundary_message"}
        />
      </div>

      {onboardingError ? (
        <InlineAlert variant="error" label={t("onboarding.could_not_continue_title")} message={onboardingError} />
      ) : null}
    </Stack>
  );
}
