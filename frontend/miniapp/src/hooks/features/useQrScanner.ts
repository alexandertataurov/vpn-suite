import { useCallback, useRef } from "react";
import { telegramFeatureClient } from "@/telegram/telegramFeatureClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function useQrScanner() {
  const handlerRef = useRef<((value: string) => void) | null>(null);

  const onScan = useCallback((handler: (value: string) => void) => {
    handlerRef.current = handler;
    return () => {
      handlerRef.current = null;
    };
  }, []);

  const open = useCallback((text?: string) => {
    telegramFeatureClient.showQrScanner(text, (value: string) => {
      handlerRef.current?.(value);
      return true;
    });
  }, []);

  const close = useCallback(() => {
    telegramFeatureClient.closeQrScanner();
  }, []);

  const onQrTextReceived = useCallback((handler: () => void) => {
    return subscribeTelegramEvent("qrTextReceived", handler);
  }, []);

  return { open, close, onScan, onQrTextReceived };
}
