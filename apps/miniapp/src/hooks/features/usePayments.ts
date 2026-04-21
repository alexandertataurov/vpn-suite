import { useCallback } from "react";
import { telegramFeatureClient } from "@/lib/telegram/telegramFeatureClient";
import { telegramClient } from "@/lib/telegram/telegramCoreClient";
import { subscribeTelegramEvent } from "@/lib/telegram/telegramEvents";
import { useOpenLink } from "@/hooks/features/useOpenLink";

export function usePayments() {
  const { openLink } = useOpenLink();

  const openInvoice = useCallback((url: string, onClosed?: (status: string) => void) => {
    if (/^https:\/\/t\.me\/\$invoice\//i.test(url) || /^https:\/\/t\.me\/invoice\//i.test(url)) {
      telegramFeatureClient.openInvoice(url, onClosed);
      return;
    }
    if (telegramClient.isInsideTelegram() && typeof window !== "undefined") {
      // External payment gateways: in Telegram iOS clients, hard navigation can be flaky.
      // Prefer Telegram's openLink on iOS; otherwise keep it inside the WebView.
      if (telegramClient.getPlatform() === "ios") {
        telegramClient.openLink(url);
        return;
      }
      window.location.assign(url);
      return;
    }
    openLink(url);
  }, [openLink]);

  const onInvoiceClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("invoiceClosed", handler);
  }, []);

  return { openInvoice, onInvoiceClosed };
}
