import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";

export function useOpenLink() {
  const openLink = useCallback((url: string) => {
    telegramClient.openLink(url);
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    telegramClient.openTelegramLink(url);
  }, []);

  return { openLink, openTelegramLink };
}

