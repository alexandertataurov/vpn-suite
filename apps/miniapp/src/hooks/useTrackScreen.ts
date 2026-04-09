import { useEffect } from "react";
import { useTelemetry } from "./useTelemetry";

export function useTrackScreen(screenName: string, userPlan?: string | null) {
  const { track } = useTelemetry(userPlan);

  useEffect(() => {
    track("screen_view", { screen_name: screenName });
  }, [screenName, track]);
}
