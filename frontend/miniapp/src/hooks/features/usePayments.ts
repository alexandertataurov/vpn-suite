import { useCallback } from "react";
import { telegramClient } from "@/telegram/telegramClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function usePayments() {
  const openInvoice = useCallback((url: string, onClosed?: (status: string) => void) => {
    telegramClient.openInvoice(url, onClosed);
  }, []);

  const onInvoiceClosed = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("invoiceClosed", handler);
  }, []);

  return { openInvoice, onInvoiceClosed };
}
