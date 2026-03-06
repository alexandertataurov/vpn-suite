import { useCallback, useEffect, useState } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { useTelegramEvent } from "./useTelegramEvent";

type TelegramViewportState = {
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
};

function readViewport(): TelegramViewportState {
  return telegramClient.getViewport();
}

export function useViewport() {
  const [state, setState] = useState<TelegramViewportState>(() => readViewport());

  const update = useCallback(() => {
    setState(readViewport());
  }, []);

  useTelegramEvent("viewportChanged", update);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [update]);

  return state;
}
