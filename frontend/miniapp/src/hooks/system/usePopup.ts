import { useCallback } from "react";
import { telegramClient, type TelegramPopupParams } from "@/telegram/telegramClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function usePopup() {
  const showPopup = useCallback(async (params: TelegramPopupParams) => {
    return telegramClient.showPopup(params);
  }, []);

  const onPopupClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("popupClosed", handler);
  }, []);

  return { showPopup, onPopupClosed };
}
