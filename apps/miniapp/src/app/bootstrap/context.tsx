import { createContext, useContext, type ReactNode } from "react";
import type { BootPhase } from "./useBootstrapMachine";

export interface BootstrapContextValue {
  phase: BootPhase;
  onboardingStep: number;
  onboardingVersion: number;
  onboardingError: string | null;
  isCompletingOnboarding: boolean;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<{ done: boolean; synced: boolean }>;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

export function BootstrapContextProvider({
  value,
  children,
}: {
  value: BootstrapContextValue;
  children: ReactNode;
}) {
  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrapContext(): BootstrapContextValue {
  const context = useContext(BootstrapContext);
  if (!context) {
    throw new Error("useBootstrapContext must be used within BootstrapController");
  }
  return context;
}
