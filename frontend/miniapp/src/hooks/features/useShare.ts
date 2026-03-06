import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";

function buildShareLink(url: string, text?: string): string {
  const qs = new URLSearchParams();
  qs.set("url", url);
  if (text) qs.set("text", text);
  return `https://t.me/share/url?${qs.toString()}`;
}

export function useShare() {
  const shareLink = useCallback((url: string, text?: string) => {
    telegramClient.openTelegramLink(buildShareLink(url, text));
  }, []);

  const shareText = useCallback((text: string) => {
    telegramFeatureClient.shareInlineQuery(text);
  }, []);

  return { shareLink, shareText };
}
