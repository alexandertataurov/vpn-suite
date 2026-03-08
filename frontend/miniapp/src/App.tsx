import { useEffect, useRef } from "react";
import { useWebappToken } from "@/api/client";
import { flushTelemetryQueue } from "@/lib/utils/telemetry";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useScrollInputIntoView } from "@/hooks/useScrollInputIntoView";
import { useLayoutDebugMode } from "@/hooks/useLayoutDebugMode";
import { useGlobalHapticFeedback } from "@/hooks/useGlobalHapticFeedback";
import { Providers } from "@/app/providers";

function App() {
  const token = useWebappToken();
  const { track } = useTelemetry();
  const appOpenSent = useRef(false);
  useScrollInputIntoView();
  useLayoutDebugMode();
  useGlobalHapticFeedback();

  useEffect(() => {
    if (!token) return;
    flushTelemetryQueue();
    if (!appOpenSent.current) {
      appOpenSent.current = true;
      track("app_open", {});
    }
  }, [token, track]);

  return <Providers />;
}

export default App;
