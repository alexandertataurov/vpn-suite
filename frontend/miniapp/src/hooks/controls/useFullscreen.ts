import { useCallback, useEffect, useState } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { useTelegramEvent } from "../telegram/useTelegramEvent";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => telegramClient.getIsFullscreen());

  const update = useCallback(() => {
    setIsFullscreen(telegramClient.getIsFullscreen());
  }, []);

  useTelegramEvent("fullscreenChanged", update);

  useEffect(() => {
    update();
  }, [update]);

  return {
    requestFullscreen: () => telegramClient.requestFullscreen(),
    exitFullscreen: () => telegramClient.exitFullscreen(),
    isFullscreen,
  };
}
