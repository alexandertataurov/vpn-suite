import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type MainButtonReserveContextValue = {
  reserve: boolean;
  setReserve: (value: boolean) => void;
};

const MainButtonReserveContext = createContext<MainButtonReserveContextValue | null>(null);

export function MainButtonReserveProvider({ children }: { children: ReactNode }) {
  const [reserve, setReserve] = useState(false);
  const setReserveStable = useCallback((value: boolean) => setReserve(value), []);
  return (
    <MainButtonReserveContext.Provider value={{ reserve, setReserve: setReserveStable }}>
      {children}
    </MainButtonReserveContext.Provider>
  );
}

export function useMainButtonReserve(): MainButtonReserveContextValue {
  const ctx = useContext(MainButtonReserveContext);
  if (!ctx) throw new Error("useMainButtonReserve must be used within MainButtonReserveProvider");
  return ctx;
}
