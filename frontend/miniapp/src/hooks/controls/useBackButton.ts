import { useCallback, useMemo } from "react";
import { telegramClient } from "@/telegram/telegramClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function useBackButton() {
  const show = useCallback(() => {
    telegramClient.getBackButton()?.show?.();
  }, []);

  const hide = useCallback(() => {
    telegramClient.getBackButton()?.hide?.();
  }, []);

  const onClick = useCallback((handler: () => void) => {
    const backButton = telegramClient.getBackButton();
    if (!backButton) return () => {};
    if (backButton.onClick && backButton.offClick) {
      backButton.onClick(handler);
      return () => backButton.offClick?.(handler);
    }
    return subscribeTelegramEvent("backButtonClicked", handler);
  }, []);

  return useMemo(() => ({ show, hide, onClick }), [hide, onClick, show]);
}
