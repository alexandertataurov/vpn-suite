import { Suspense } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Outlet } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AppRoutes } from "../routes";

const mockUseBootstrapContext = vi.fn();

vi.mock("@/app/bootstrap/context", () => ({
  useBootstrapContext: () => mockUseBootstrapContext(),
}));

vi.mock("@/app/ViewportLayout", () => ({
  StackFlowLayout: () => <Outlet />,
}));

vi.mock("@/features/home/HomePage", () => ({
  HomePage: () => <div>Home page</div>,
}));

vi.mock("@/features/onboarding/OnboardingPage", () => ({
  OnboardingPage: () => <div>Onboarding page</div>,
}));

vi.mock("@/features/checkout/CheckoutPage", () => ({
  CheckoutPage: () => <div>Checkout page</div>,
}));

vi.mock("@/features/plan/PlanPage", () => ({
  PlanPage: () => <div>Plan page</div>,
}));

vi.mock("@/features/settings/SettingsPage", () => ({
  SettingsPage: () => <div>Settings page</div>,
}));

vi.mock("@/features/devices/DevicesPage", () => ({
  DevicesPage: () => <div>Devices page</div>,
}));

vi.mock("@/features/support/SupportPage", () => ({
  SupportPage: () => <div>Support page</div>,
}));

vi.mock("@/features/connect-status/ConnectStatusPage", () => ({
  ConnectStatusPage: () => <div>Connect status page</div>,
}));

vi.mock("@/features/restore-access/RestoreAccessPage", () => ({
  RestoreAccessPage: () => <div>Restore access page</div>,
}));

vi.mock("@/features/referral/ReferralPage", () => ({
  ReferralPage: () => <div>Referral page</div>,
}));

function renderRoutes(initialEntries: string[]) {
  return render(
    <Suspense fallback={<div>Loading…</div>}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    </Suspense>,
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects new onboarding users from home to onboarding", async () => {
    mockUseBootstrapContext.mockReturnValue({
      phase: "onboarding",
      onboardingStep: 0,
    });

    renderRoutes(["/"]);

    expect(await screen.findByText("Onboarding page")).toBeInTheDocument();
  });

  it("keeps existing users out of onboarding once app is ready", async () => {
    mockUseBootstrapContext.mockReturnValue({
      phase: "app_ready",
      onboardingStep: 3,
    });

    renderRoutes(["/onboarding"]);

    expect(await screen.findByText("Home page")).toBeInTheDocument();
  });

  it("renders the dedicated plan page for plan routes", async () => {
    mockUseBootstrapContext.mockReturnValue({
      phase: "app_ready",
      onboardingStep: 3,
    });

    renderRoutes(["/plan"]);

    expect(await screen.findByText("Plan page")).toBeInTheDocument();
  });
});
