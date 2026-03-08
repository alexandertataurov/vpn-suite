import { createContext, useContext, type ReactNode } from "react";

export interface LayoutContextValue {
  stackFlow: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({
  stackFlow,
  children,
}: {
  stackFlow: boolean;
  children: ReactNode;
}) {
  return (
    <LayoutContext.Provider value={{ stackFlow }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) return { stackFlow: false };
  return ctx;
}
