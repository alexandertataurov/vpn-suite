/**
 * Per guidelines: Use hideKeyboard() (Bot API 9.1+) when appropriate.
 * Call on form submit or when dismissing input focus.
 */
import { useCallback } from "react";
import { telegramClient } from "@/lib/telegram/telegramCoreClient";

export function useHideKeyboard() {
  return useCallback(() => {
    telegramClient.hideKeyboard();
  }, []);
}
