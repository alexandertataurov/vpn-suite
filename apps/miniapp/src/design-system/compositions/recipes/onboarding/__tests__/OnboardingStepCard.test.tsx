import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingStepCard, ONBOARDING_STEPS } from "@/design-system/recipes";

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "onboarding.step_intro_cta": "Choose plan",
        "onboarding.step_install_cta": "Continue",
        "onboarding.step_install_ready_cta": "Continue setup",
        "onboarding.go_to_devices": "Go to Devices",
        "onboarding.choose_plan": "Choose plan",
        "onboarding.open_amneziavpn": "Open AmneziaVPN",
        "onboarding.step_confirm_primary": "Confirm setup",
        "onboarding.intro_panel_title": "Choose a plan",
        "onboarding.intro_panel_body": "Pick a plan to activate access and continue setup.",
        "onboarding.config_step_install_title": "Install AmneziaVPN",
        "onboarding.config_step_install_body": "Install from the App Store or Google Play if needed.",
        "onboarding.install_copy_ready": "AmneziaVPN is installed. Continue when you're ready.",
        "onboarding.config_ready_panel_title": "Add your first device",
        "onboarding.config_ready_panel_body": "Open Devices and create your first config.",
        "onboarding.step_get_config_title": "Get your config",
        "onboarding.step_get_config_body": "Choose a plan, then add your first device.",
        "onboarding.confirm_panel_title": "Connect in AmneziaVPN",
        "onboarding.confirm_open_app_note": "Open AmneziaVPN, import the config there, then return here.",
        "onboarding.confirm_setup": "Confirm setup",
        "onboarding.confirm_panel_body": "Import the config in AmneziaVPN and connect there.",
        "onboarding.step_confirm_body": "Import the config in AmneziaVPN and connect there.",
        "onboarding.could_not_continue_title": "Could not continue",
        "onboarding.get_config_first": "Get config first",
        "onboarding.get_config_first_body": "Open Devices and add a device if you do not have a config yet.",
        "onboarding.setup_activity_detected_title": "Setup activity detected",
        "onboarding.setup_activity_detected_message_with_ip": "We detected setup activity from IP {ip}. Confirm setup when you're back.",
        "onboarding.setup_activity_detected_message_generic": "We detected recent setup activity. Confirm setup when you're back.",
        "onboarding.what_happens_next_title": "What happens next",
        "onboarding.what_happens_next_message": "Return here after you connect if you want to save setup progress.",
        "onboarding.connection_boundary_title": "VPN boundary",
        "onboarding.connection_boundary_message": "Import the config in AmneziaVPN and connect there.",
        "onboarding.add_device_note_title": "Add a device",
        "onboarding.issue_note": "In AmneziaVPN, tap Add configuration, then import the file or paste the config.",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe("OnboardingStepCard", () => {
  it("uses a more specific ready-state label after the app is already installed", () => {
    render(
      <OnboardingStepCard
        step={ONBOARDING_STEPS[1]}
        onboardingError={null}
        appAlreadyInstalled
        onOpenIos={() => {}}
        onOpenAndroid={() => {}}
        onMarkInstalled={() => {}}
        onPrimaryAction={() => {}}
        isBusy={false}
        hasActivePlan={false}
        hasActiveDevice={false}
        hasDetectedActivity={false}
        detectedIp={null}
      />,
    );

    expect(screen.getByRole("button", { name: "Continue setup" })).toBeInTheDocument();
  });
});
