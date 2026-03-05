import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";

export function useClosingConfirmation() {
  const enableClosingConfirmation = useCallback(() => {
    telegramClient.enableClosingConfirmation();
  }, []);

  const disableClosingConfirmation = useCallback(() => {
    telegramClient.disableClosingConfirmation();
  }, []);

  return { enableClosingConfirmation, disableClosingConfirmation };
}

