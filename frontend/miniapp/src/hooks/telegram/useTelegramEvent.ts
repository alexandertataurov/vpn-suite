import { useEffect, useRef } from "react";
import type { TelegramEventName } from "@/telegram/telegramCoreClient";
import { subscribeTelegramEvent } from "@/telegram/telegramEvents";

export function useTelegramEvent(event: TelegramEventName, handler: () => void, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return subscribeTelegramEvent(event, () => handlerRef.current());
  }, [enabled, event]);
}
