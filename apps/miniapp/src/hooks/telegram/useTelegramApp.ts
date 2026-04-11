import { useCallback, useEffect, useState } from "react";
import { telegramClient } from "@/lib/telegram/telegramCoreClient";
import { useTelegramEvent } from "./useTelegramEvent";

export function useTelegramApp() {
  const [isExpanded, setIsExpanded] = useState(() => telegramClient.getIsExpanded());
  const [isFullscreen, setIsFullscreen] = useState(() => telegramClient.getIsFullscreen());
  const [platform, setPlatform] = useState(() => telegramClient.getPlatform());

  const update = useCallback(() => {
    setIsExpanded(telegramClient.getIsExpanded());
    setIsFullscreen(telegramClient.getIsFullscreen());
    setPlatform(telegramClient.getPlatform());
  }, []);

  useTelegramEvent("viewportChanged", update);
  useTelegramEvent("fullscreenChanged", update);

  useEffect(() => {
    update();
  }, [update]);

  return {
    ready: () => telegramClient.ready(),
    expand: () => telegramClient.expand(),
    close: () => telegramClient.close(),
    isExpanded,
    isFullscreen,
    platform,
    isDesktop: platform === "desktop",
    isAvailable: telegramClient.isAvailable(),
  };
}
