import { createContext, useCallback, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ANALYTICS_METRICS_KPIS_KEY,
  ANALYTICS_TELEMETRY_SERVICES_KEY,
  DOCKER_TELEMETRY_KEY,
  OPERATOR_DASHBOARD_KEY,
  SERVERS_LIST_KEY,
  TELEMETRY_SNAPSHOT_KEY,
  TELEMETRY_TOPOLOGY_KEY,
} from "../api/query-keys";
import { refreshRegisteredResources } from "../utils/resourceRegistry";

export const TELEMETRY_REFETCH_KEYS = [
  OPERATOR_DASHBOARD_KEY,
  TELEMETRY_SNAPSHOT_KEY,
  TELEMETRY_TOPOLOGY_KEY,
  DOCKER_TELEMETRY_KEY,
  ANALYTICS_TELEMETRY_SERVICES_KEY,
  ANALYTICS_METRICS_KPIS_KEY,
  SERVERS_LIST_KEY,
] as const;

interface TelemetryContextValue {
  refetchOperatorDashboard: () => Promise<void>;
  refetchAllTelemetry: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const refetchOperatorDashboard = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: OPERATOR_DASHBOARD_KEY });
  }, [queryClient]);

  const refetchAllTelemetry = useCallback(async () => {
    await Promise.all([
      ...TELEMETRY_REFETCH_KEYS.map((key) =>
        queryClient.refetchQueries({ queryKey: key })
      ),
      refreshRegisteredResources(),
    ]);
  }, [queryClient]);

  const value = useMemo<TelemetryContextValue>(
    () => ({ refetchOperatorDashboard, refetchAllTelemetry }),
    [refetchOperatorDashboard, refetchAllTelemetry]
  );

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetryContext(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error("useTelemetryContext must be used within TelemetryProvider");
  }
  return ctx;
}

export function useTelemetryContextOptional(): TelemetryContextValue | null {
  return useContext(TelemetryContext);
}
