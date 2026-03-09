import { useEffect, useRef } from "react";
import { useWebappToken } from "@/api/client";
import { flushTelemetryQueue } from "@/telemetry/webappTelemetry";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useScrollInputIntoView } from "@/hooks/useScrollInputIntoView";
import { useLayoutDebugMode } from "@/hooks/useLayoutDebugMode";
import { useGlobalHapticFeedback } from "@/hooks/useGlobalHapticFeedback";
import { AppErrorBoundary } from "@/app/AppErrorBoundary";
import { AppShell } from "@/app/AppShell";

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

  return (
    <AppErrorBoundary>
      <AppShell />
    </AppErrorBoundary>
  );
}

export default App;
