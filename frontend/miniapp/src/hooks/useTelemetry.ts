import { useCallback } from "react";
import { webappApi } from "../api/client";

const BUILD_VERSION =
  typeof import.meta !== "undefined" && import.meta.env?.MODE ? import.meta.env.MODE : "unknown";

interface TelemetryPayload {
  screen_name?: string;
  cta_name?: string;
  plan_id?: string;
  user_plan?: string;
  latency_ms?: number;
  [key: string]: string | number | boolean | undefined;
}

export function useTelemetry(userPlan?: string | null) {
  const track = useCallback(
    async (eventType: string, payload: TelemetryPayload = {}) => {
      const body = {
        event_type: eventType,
        payload: { ...payload, build_version: BUILD_VERSION, user_plan: userPlan ?? undefined },
      };
      try {
        await webappApi.post("/webapp/telemetry", body);
      } catch {
        // Fire-and-forget; avoid breaking UI
      }
    },
    [userPlan]
  );

  return { track };
}
