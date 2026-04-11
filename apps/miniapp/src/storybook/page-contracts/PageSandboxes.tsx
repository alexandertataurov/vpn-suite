import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BootstrapContextProvider } from "@/app/bootstrap";
import { ToastContainer } from "@/design-system";
import { createStorybookQueryClient } from "../queryClient";
import { ViewportShellRoutes } from "../withViewportShell";
import { useMockScenarioFetch } from "./mockApi";
import type { MockScenario } from "./types";

export function PageSandbox({
  children,
  scenario,
  initialEntries,
}: {
  children: ReactElement;
  scenario: MockScenario;
  initialEntries: string[];
}) {
  const [tokenReady, setTokenReady] = useState(false);
  const bootstrapValue = useMemo(
    () => ({
      phase: "app_ready" as const,
      onboardingStep: 0,
      onboardingVersion: 2,
      onboardingError: null,
      isCompletingOnboarding: false,
      setOnboardingStep: async () => undefined,
      completeOnboarding: async () => ({ done: true, synced: true }),
    }),
    [],
  );
  const client = useMemo(() => createStorybookQueryClient(), []);

  useMockScenarioFetch(client, scenario, () => {
    setTokenReady(true);
  });

  if (!tokenReady) return null;

  return (
    <StorybookPageProviders
      client={client}
      bootstrapValue={bootstrapValue}
      initialEntries={initialEntries}
    >
      {children}
    </StorybookPageProviders>
  );
}

export function OnboardingSandbox({
  children,
  scenario,
  initialEntries,
  step = 0,
}: {
  children: ReactNode;
  scenario: MockScenario;
  initialEntries: string[];
  step?: number;
}) {
  const [onboardingStep, setOnboardingStep] = useState(step);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const bootstrapValue = useMemo(
    () => ({
      phase: "onboarding" as const,
      onboardingStep,
      onboardingVersion: 2,
      onboardingError: null,
      isCompletingOnboarding,
      setOnboardingStep: async (next: number) => {
        setOnboardingStep(next);
      },
      completeOnboarding: async () => {
        setIsCompletingOnboarding(true);
        await Promise.resolve();
        setIsCompletingOnboarding(false);
        return { done: true, synced: true };
      },
    }),
    [isCompletingOnboarding, onboardingStep],
  );
  const client = useMemo(() => createStorybookQueryClient(), []);

  useMockScenarioFetch(client, scenario);

  return (
    <StorybookPageProviders
      client={client}
      bootstrapValue={bootstrapValue}
      initialEntries={initialEntries}
    >
      {children}
    </StorybookPageProviders>
  );
}

function StorybookPageProviders({
  children,
  client,
  bootstrapValue,
  initialEntries,
}: {
  children: ReactNode;
  client: ReturnType<typeof createStorybookQueryClient>;
  bootstrapValue: ReactElement<typeof BootstrapContextProvider>["props"]["value"];
  initialEntries: string[];
}) {
  return (
    <QueryClientProvider client={client}>
      <ToastContainer>
        <BootstrapContextProvider value={bootstrapValue}>
          <ViewportShellRoutes initialEntries={initialEntries} variant="stack">
            {children}
          </ViewportShellRoutes>
        </BootstrapContextProvider>
      </ToastContainer>
    </QueryClientProvider>
  );
}
