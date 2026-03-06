import { useCallback } from "react";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";

export function useClipboard() {
  const readText = useCallback(async () => {
    return telegramFeatureClient.readClipboardText();
  }, []);

  const writeText = useCallback(async (text: string) => {
    return telegramFeatureClient.writeClipboardText(text);
  }, []);

  return { readText, writeText };
}
