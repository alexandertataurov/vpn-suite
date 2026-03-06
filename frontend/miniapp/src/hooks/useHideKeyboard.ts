/**
 * Per guidelines: Use hideKeyboard() (Bot API 9.1+) when appropriate.
 * Call on form submit or when dismissing input focus.
 */
import { telegramClient } from "@/telegram/telegramCoreClient";

export function useHideKeyboard() {
  return () => {
    telegramClient.hideKeyboard();
  };
}
