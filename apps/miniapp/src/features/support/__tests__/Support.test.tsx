import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupportPage } from "../SupportPage";
import { LayoutProvider } from "@/context/LayoutContext";
import { ToastContainer } from "@/design-system";
import { renderWithProviders } from "@/test/utils/render";

const connectionBody =
  "Start with Plan and confirm that your subscription is active. Then open Devices and make sure the current device still exists and the config was imported into AmneziaVPN without edits. If the app still does not connect, revoke that device, create a fresh config, import it again, and retry. If your access expired or the app shows no active entitlement, open Restore access before contacting support.";

vi.mock("@/features/support/model/useSupportPageModel", () => ({
  useSupportPageModel: () => ({
    header: { title: "Support" },
    pageState: { status: "ready" },
    faqItems: [
      { title: "VPN not connecting", body: connectionBody },
      { title: "Setup", body: "Other FAQ body" },
      { title: "Restore access", body: "Other FAQ body" },
      { title: "Replace device or config", body: "Other FAQ body" },
      { title: "Billing or plan", body: "Other FAQ body" },
      { title: "Privacy and security", body: "Other FAQ body" },
      { title: "When to contact support", body: "Other FAQ body" },
      { title: "Slow or unstable connection", body: "Other FAQ body" },
      { title: "Cancel or change plan", body: "Other FAQ body" },
      { title: "What data we store", body: "Other FAQ body" },
    ],
    hero: {
      eyebrow: "Support",
      title: "Help is always available",
      subtitle: "Use this page when payment, setup, or restore does not behave as expected.",
      edge: "e-b",
      glow: "g-blue",
    },
    troubleshooterBadge: { tone: "neutral", label: "Step 1/4" },
    step: 0,
    totalSteps: 4,
    currentStep: {
      title: "Check access status",
      body: "Open Home or Plan. If there is no active plan, choose one before trying device setup.",
      nextLabel: "Access is active",
      backLabel: "Back",
    },
    currentStepAltLabel: "No, choose plan",
    faqOffline: false,
    nextStep: vi.fn(),
    previousStep: undefined,
  }),
}));

vi.mock("@/config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/env")>();

  return {
    ...actual,
    supportContactUsername: "aplhaVPNSupport",
    privacyPolicyUrl: "https://example.com/privacy",
    userAgreementUrl: "https://example.com/terms",
    getSupportContactHandle: () => "@aplhaVPNSupport",
    getSupportContactHref: () => undefined,
  };
});

describe("SupportPage", () => {
  it("renders a compact support layout with collapsed faq items", () => {
    renderWithProviders(
      <LayoutProvider stackFlow={false}>
        <ToastContainer>
          <SupportPage />
        </ToastContainer>
      </LayoutProvider>,
    );

    expect(screen.getByText("Help is always available")).toBeInTheDocument();
    expect(screen.getAllByText("Contact support").length).toBeGreaterThan(0);
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText("Support link unavailable")).toBeInTheDocument();
    expect(screen.getByText("Privacy policy")).toBeInTheDocument();
    expect(screen.getByText("User agreement")).toBeInTheDocument();
    expect(screen.getByText(/@aplhaVPNSupport/)).toBeInTheDocument();
    expect(screen.queryByText("All systems operational")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Billing or plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore access" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replace device or config" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "When to contact support" })).toBeInTheDocument();

    const faqTrigger = screen.getByRole("button", { name: "VPN not connecting" });
    expect(faqTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(faqTrigger);

    expect(faqTrigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "Start with Plan and confirm that your subscription is active. Then open Devices and make sure the current device still exists and the config was imported into AmneziaVPN without edits. If the app still does not connect, revoke that device, create a fresh config, import it again, and retry. If your access expired or the app shows no active entitlement, open Restore access before contacting support.",
      ),
    ).toBeInTheDocument();
  }, 15000);
});
