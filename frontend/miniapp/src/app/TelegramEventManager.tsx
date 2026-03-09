import { useEffect } from "react";
import { TELEGRAM_EVENT_NAMES } from "@/telegram/telegram.types";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { emitTelegramEvent, setTelegramEventManagerActive } from "@/telegram/telegramEvents";

/**
 * Single runtime event bridge for Telegram WebApp events.
 * All hooks subscribe through telegramEvents.ts to avoid scattered onEvent bindings.
 * TELEGRAM_EVENT_NAMES is single source; derived from telegram.types.
 */
export function TelegramEventManager() {
  useEffect(() => {
    setTelegramEventManagerActive(true);
    const offs = TELEGRAM_EVENT_NAMES.map((event) =>
      telegramClient.onEvent(event, (payload) => emitTelegramEvent(event, payload)),
    );

    return () => {
      setTelegramEventManagerActive(false);
      for (const off of offs) {
        off();
      }
    };
  }, []);

  return null;
}

