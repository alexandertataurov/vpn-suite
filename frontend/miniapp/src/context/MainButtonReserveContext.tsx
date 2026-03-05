import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type MainButtonReserveContextValue = {
  reserve: boolean;
  setReserve: (value: boolean) => void;
};

const defaultValue: MainButtonReserveContextValue = {
  reserve: false,
  setReserve: () => {},
};

const MainButtonReserveContext = createContext<MainButtonReserveContextValue>(defaultValue);

export function MainButtonReserveProvider({ children }: { children: ReactNode }) {
  const [reserve, setReserve] = useState(false);
  const setReserveStable = useCallback((value: boolean) => setReserve(value), []);
  return (
    <MainButtonReserveContext.Provider value={{ reserve, setReserve: setReserveStable }}>
      {children}
    </MainButtonReserveContext.Provider>
  );
}

export function useMainButtonReserve() {
  return useContext(MainButtonReserveContext);
}
