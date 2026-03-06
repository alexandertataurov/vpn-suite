import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";

export function useClosingConfirmation() {
  const enableClosingConfirmation = useCallback(() => {
    telegramClient.enableClosingConfirmation();
  }, []);

  const disableClosingConfirmation = useCallback(() => {
    telegramClient.disableClosingConfirmation();
  }, []);

  return { enableClosingConfirmation, disableClosingConfirmation };
}

