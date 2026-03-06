import { useEffect } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useScrollInputIntoView } from "@/hooks/useScrollInputIntoView";
import { useLayoutDebugMode } from "@/hooks/useLayoutDebugMode";
import { useGlobalHapticFeedback } from "@/hooks/useGlobalHapticFeedback";
import { Providers } from "@/app/providers";

function App() {
  const { track } = useTelemetry();
  useScrollInputIntoView();
  useLayoutDebugMode();
  useGlobalHapticFeedback();
  useEffect(() => {
    track("app_open", {});
  }, [track]);

  return <Providers />;
}

export default App;
