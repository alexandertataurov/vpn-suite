import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ToastContainer } from "@/design-system";
import { OnboardingPage } from "../OnboardingPage";
import { webappMeActive } from "@/test/fixtures/session";

const { mockTrack, mockUseSession, mockUseTelemetry, mockUseOpenLink, mockUseTelegramWebApp } = vi.hoisted(
  () => ({
    mockTrack: vi.fn(),
    mockUseSession: vi.fn(),
    mockUseTelemetry: vi.fn(),
    mockUseOpenLink: vi.fn(),
    mockUseTelegramWebApp: vi.fn(),
  }),
);

vi.mock("@/hooks", () => ({
  useOpenLink: () => mockUseOpenLink(),
  useSession: (...args: unknown[]) => mockUseSession(...args),
  useTelemetry: (...args: unknown[]) => mockUseTelemetry(...args),
  useTelegramWebApp: () => mockUseTelegramWebApp(),
}));

vi.mock("@/app/bootstrap/context", () => ({
  useBootstrapContext: () => ({
    onboardingStep: 0,
    onboardingError: null,
    isCompletingOnboarding: false,
    setOnboardingStep: vi.fn(),
    completeOnboarding: vi.fn(),
  }),
}));

function renderPage(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <QueryClientProvider client={client}>
        <ToastContainer>{children}</ToastContainer>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockTrack.mockReset();
    mockUseOpenLink.mockReturnValue({ openLink: vi.fn() });
    mockUseTelegramWebApp.mockReturnValue({ isInsideTelegram: false });
    mockUseTelemetry.mockReturnValue({ track: mockTrack });
    mockUseSession.mockReturnValue({ data: webappMeActive });
  });

  it("adds the guidance snapshot to onboarding telemetry", async () => {
    renderPage(<OnboardingPage />);

    await waitFor(() => expect(mockTrack).toHaveBeenCalled());

    expect(mockTrack).toHaveBeenNthCalledWith(
      1,
      "onboarding_started",
      expect.objectContaining({
        guidance_context_id: expect.any(String),
        flow_stage: "onboarding",
        step_index: 0,
        step_id: "intro",
        current_route: "/onboarding",
        last_action: "onboarding_started",
      }),
    );
    expect(mockTrack).toHaveBeenNthCalledWith(
      2,
      "onboarding_step_viewed",
      expect.objectContaining({
        guidance_context_id: expect.any(String),
        flow_stage: "onboarding",
        step_index: 0,
        step_id: "intro",
        current_route: "/onboarding",
        last_action: "onboarding_step_viewed",
      }),
    );
  });
});
