import { useCallback } from "react";
import { telegramFeatureClient } from "@/lib/telegram/telegramFeatureClient";
import { subscribeTelegramEvent } from "@/lib/telegram/telegramEvents";
import { useOpenLink } from "@/hooks/features/useOpenLink";

export function usePayments() {
  const { openLink } = useOpenLink();

  const openInvoice = useCallback((url: string, onClosed?: (status: string) => void) => {
    if (/^https:\/\/t\.me\/\$invoice\//i.test(url) || /^https:\/\/t\.me\/invoice\//i.test(url)) {
      telegramFeatureClient.openInvoice(url, onClosed);
      return;
    }
    openLink(url);
  }, [openLink]);

  const onInvoiceClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("invoiceClosed", handler);
  }, []);

  return { openInvoice, onInvoiceClosed };
}
