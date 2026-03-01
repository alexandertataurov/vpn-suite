import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type DensityMode = "comfortable" | "combat";

const DensityContext = createContext<{
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
} | null>(null);

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<DensityMode>("comfortable");
  const setDensity = useCallback((d: DensityMode) => setDensityState(d), []);
  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) return { density: "comfortable" as DensityMode, setDensity: () => {} };
  return ctx;
}
