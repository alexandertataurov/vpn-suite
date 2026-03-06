import { useCallback } from "react";
import type { TelegramPopupParams } from "@/telegram/telegramCoreClient";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function usePopup() {
  const showPopup = useCallback(async (params: TelegramPopupParams) => {
    return telegramFeatureClient.showPopup(params);
  }, []);

  const onPopupClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("popupClosed", handler);
  }, []);

  return { showPopup, onPopupClosed };
}
