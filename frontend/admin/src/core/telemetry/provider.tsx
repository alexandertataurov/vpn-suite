import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { LiveClusterState, LiveConnectionState } from "./types";
import { startTelemetryStream } from "./client";

interface TelemetryContextValue {
  cluster: LiveClusterState | null;
  connectionState: LiveConnectionState;
  isLiveAvailable: boolean;
}

const TelemetryContext = createContext<TelemetryContextValue | undefined>(undefined);

const isLiveEnabled =
  typeof import.meta !== "undefined" && (import.meta as { env?: { VITE_LIVE_OBS_ENABLED?: string } }).env?.VITE_LIVE_OBS_ENABLED === "1";

const FALLBACK_VALUE: TelemetryContextValue = {
  cluster: null,
  connectionState: "offline",
  isLiveAvailable: false,
};

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [cluster, setCluster] = useState<LiveClusterState | null>(null);
  const [connectionState, setConnectionState] = useState<LiveConnectionState>("offline");

  useEffect(() => {
    if (!isLiveEnabled) return undefined;
    const cleanup = startTelemetryStream({
      onEvent: () => setCluster((c) => c),
      onConnectionStateChange: setConnectionState,
    });
    return cleanup;
  }, []);

  const value = useMemo<TelemetryContextValue>(
    () => ({
      cluster,
      connectionState,
      isLiveAvailable: isLiveEnabled,
    }),
    [cluster, connectionState]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  return ctx ?? FALLBACK_VALUE;
}
