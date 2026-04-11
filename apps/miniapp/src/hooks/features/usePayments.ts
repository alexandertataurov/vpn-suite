import { useCallback } from "react";
import { telegramFeatureClient } from "@/lib/telegram/telegramFeatureClient";
import { subscribeTelegramEvent } from "@/lib/telegram/telegramEvents";

export function usePayments() {
  const openInvoice = useCallback((url: string, onClosed?: (status: string) => void) => {
    telegramFeatureClient.openInvoice(url, onClosed);
  }, []);

  const onInvoiceClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("invoiceClosed", handler);
  }, []);

  return { openInvoice, onInvoiceClosed };
}
