import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";

export function useClipboard() {
  const readText = useCallback(async () => {
    return telegramClient.readClipboardText();
  }, []);

  const writeText = useCallback(async (text: string) => {
    return telegramClient.writeClipboardText(text);
  }, []);

  return { readText, writeText };
}

