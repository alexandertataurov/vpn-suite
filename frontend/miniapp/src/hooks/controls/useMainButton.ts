import { useCallback, useMemo } from "react";
import { telegramClient } from "@/telegram/telegramClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function useMainButton() {
  const show = useCallback(() => {
    telegramClient.getMainButton()?.show?.();
  }, []);

  const hide = useCallback(() => {
    telegramClient.getMainButton()?.hide?.();
  }, []);

  const setText = useCallback((text: string) => {
    const mainButton = telegramClient.getMainButton();
    if (!mainButton) return;
    mainButton.text = text;
  }, []);

  const enable = useCallback(() => {
    telegramClient.getMainButton()?.enable?.();
  }, []);

  const disable = useCallback(() => {
    telegramClient.getMainButton()?.disable?.();
  }, []);

  const setProgress = useCallback((loading: boolean) => {
    const mainButton = telegramClient.getMainButton();
    if (!mainButton) return;
    if (loading) mainButton.showProgress?.(true);
    else mainButton.hideProgress?.();
  }, []);

  const onClick = useCallback((handler: () => void) => {
    const mainButton = telegramClient.getMainButton();
    if (!mainButton) return () => {};
    if (mainButton.onClick && mainButton.offClick) {
      mainButton.onClick(handler);
      return () => mainButton.offClick?.(handler);
    }
    return subscribeTelegramEvent("mainButtonClicked", handler);
  }, []);

  return useMemo(
    () => ({ show, hide, setText, enable, disable, setProgress, onClick }),
    [disable, enable, hide, onClick, setProgress, setText, show],
  );
}
