import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";

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
    telegramClient.shareInlineQuery(text);
  }, []);

  return { shareLink, shareText };
}

