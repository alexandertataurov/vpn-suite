import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export const isLiveMetricsStreamEnabled = false;

export interface LiveMetricsContextValue {
  cluster: null;
  connectionState: "offline";
  isLiveStreamAvailable: false;
}

const LiveMetricsContext = createContext<LiveMetricsContextValue | undefined>(undefined);

const stubValue: LiveMetricsContextValue = {
  cluster: null,
  connectionState: "offline",
  isLiveStreamAvailable: false,
};

export function LiveMetricsProvider({ children }: { children: ReactNode }) {
  return (
    <LiveMetricsContext.Provider value={stubValue}>
      {children}
    </LiveMetricsContext.Provider>
  );
}

export function useLiveMetricsContext(): LiveMetricsContextValue {
  const ctx = useContext(LiveMetricsContext);
  return ctx ?? stubValue;
}

export function useClusterLiveMetrics(): null {
  return null;
}

export function useNodeLiveMetrics(_nodeId: string): null {
  return null;
}

export function useLiveConnectionState(): "offline" {
  return "offline";
}
