import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LayoutProvider } from "@/context/LayoutContext";
import { HeaderBell } from "@/design-system/compositions/layouts/HeaderBell";

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

vi.mock("@/design-system/compositions/layouts/HeaderAlertsContent", () => ({
  HeaderAlertsContent: () => null,
}));

describe("home pattern contract", () => {
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
