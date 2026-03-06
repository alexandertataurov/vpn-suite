import { useEffect } from "react";
import { telegramClient, type TelegramEventName } from "@/telegram/telegramCoreClient";
import { emitTelegramEvent, setTelegramEventManagerActive } from "@/telegram/telegramEvents";

const TELEGRAM_RUNTIME_EVENTS: TelegramEventName[] = [
  "viewportChanged",
  "safeAreaChanged",
  "contentSafeAreaChanged",
  "themeChanged",
  "fullscreenChanged",
  "mainButtonClicked",
  "backButtonClicked",
  "invoiceClosed",
  "popupClosed",
  "qrTextReceived",
];

/**
 * Single runtime event bridge for Telegram WebApp events.
 * All hooks subscribe through telegramEvents.ts to avoid scattered onEvent bindings.
 */
export function TelegramEventManager() {
  useEffect(() => {
    setTelegramEventManagerActive(true);
    const offs = TELEGRAM_RUNTIME_EVENTS.map((event) =>
      telegramClient.onEvent(event, () => {
        emitTelegramEvent(event);
      }),
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

