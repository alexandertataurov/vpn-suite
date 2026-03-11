import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LayoutProvider } from "@/context/LayoutContext";
import { HeaderBell } from "@/design-system/layouts/HeaderBell";
import { HomeDynamicBlock } from "@/design-system/patterns/home/HomeDynamicBlock";
import { HomeHeroPanel } from "@/design-system/patterns/home/HomeHeroPanel";
import { HomePrimaryActionZone } from "@/design-system/patterns/home/HomePrimaryActionZone";

const { mockUseTelegramHaptics, mockUseUnifiedAlerts } = vi.hoisted(() => ({
  mockUseTelegramHaptics: vi.fn(),
  mockUseUnifiedAlerts: vi.fn(),
}));

vi.mock("@/hooks/useTelegramHaptics", () => ({
  useTelegramHaptics: () => mockUseTelegramHaptics(),
}));

vi.mock("@/hooks/useUnifiedAlerts", () => ({
  useUnifiedAlerts: (...args: unknown[]) => mockUseUnifiedAlerts(...args),
}));

vi.mock("@/design-system/components/feedback/Popover", () => ({
  Popover: ({ renderTrigger }: { renderTrigger: (props: Record<string, unknown>) => JSX.Element }) => renderTrigger({}),
}));

vi.mock("@/design-system/layouts/HeaderAlertsContent", () => ({
  HeaderAlertsContent: () => null,
}));

describe("home pattern contract", () => {
  it("hides the hero server row in the no-plan empty state", () => {
    const { container } = render(
      <HomeHeroPanel
        variant="disconnected"
        statusText="No active plan"
        statusHint="Choose a plan to activate your tunnel."
        latencyLabel="Offline"
        latencyTone="mut"
        bandwidthLabel="--"
        bandwidthTone="mut"
        timeLeftLabel="Not started"
        timeLeftTone="mut"
        showServerRow={false}
      />,
    );

    expect(screen.getByText("No active plan")).not.toBeNull();
    expect(container.querySelector(".home-hero-server")).toBeNull();
  });

  it("renders the no-plan CTA with a stacked help link", () => {
    const { container } = render(
      <MemoryRouter>
        <HomePrimaryActionZone state="no_plan" planTo="/plan" supportTo="/support" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /choose plan/i })).not.toBeNull();
    const helpLink = screen.getByRole("link", { name: /need help\\?/i });
    expect(helpLink).not.toBeNull();
    expect(helpLink.querySelector("svg")).toBeNull();
    expect(container.querySelector(".miniapp-inline-link--stacked")).not.toBeNull();
  });

  it("renders a neutral clear state without a clear chip", () => {
    const { container } = render(
      <HomeDynamicBlock
        daysLeft={30}
        hasSub
        deviceLimit={5}
        usedDevices={1}
        healthError={false}
        bandwidthRemainingPercent={60}
      />,
    );

    expect(screen.getByText("No account issues")).not.toBeNull();
    expect(screen.queryByText("Clear")).toBeNull();
    expect(container.querySelector(".home-signal-card--clear")).not.toBeNull();
  });

  it("renders a 44px bell button with a dot indicator when unread items exist", () => {
    mockUseTelegramHaptics.mockReturnValue({ impact: vi.fn() });
    mockUseUnifiedAlerts.mockReturnValue({ items: [{ id: "1" }], count: 1 });

    const { container } = render(
      <LayoutProvider stackFlow={false}>
        <HeaderBell />
      </LayoutProvider>,
    );

    expect(screen.getByRole("button", { name: "Notifications" })).not.toBeNull();
    expect(container.querySelector(".miniapp-content-bell-indicator")).not.toBeNull();
  });
});
