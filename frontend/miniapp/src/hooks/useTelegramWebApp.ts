import { useOpenLink } from "./features/useOpenLink";
import { useTelegramApp } from "./telegram/useTelegramApp";
import { useTelegramInitData } from "./telegram/useTelegramInitData";
import { initTelegramRuntime as initRuntime } from "@/telegram/telegramClient";

export function useTelegramWebApp() {
  const { isAvailable } = useTelegramApp();
  const { initData, isInsideTelegram } = useTelegramInitData();
  const { openLink } = useOpenLink();

  return {
    initData,
    isInsideTelegram: isInsideTelegram || isAvailable,
    openLink,
  };
}

export function initTelegramRuntime() {
  initRuntime();
}

