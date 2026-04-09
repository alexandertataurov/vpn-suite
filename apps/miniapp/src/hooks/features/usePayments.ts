import { useCallback } from "react";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function usePayments() {
  const openInvoice = useCallback((url: string, onClosed?: (status: string) => void) => {
    telegramFeatureClient.openInvoice(url, onClosed);
  }, []);

  const onInvoiceClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("invoiceClosed", handler);
  }, []);

  return { openInvoice, onInvoiceClosed };
}
