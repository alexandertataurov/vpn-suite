import { telegramClient, type TelegramEventName } from "./telegramCoreClient";
import { TELEGRAM_EVENT_NAMES } from "./telegram.types";

export type TelegramEventListener = (payload?: unknown) => void;

const listenerRegistry = Object.fromEntries(
  TELEGRAM_EVENT_NAMES.map((e) => [e, new Set<TelegramEventListener>()]),
) as Record<TelegramEventName, Set<TelegramEventListener>>;

let eventManagerActive = false;

export function setTelegramEventManagerActive(active: boolean) {
  eventManagerActive = active;
}

export function emitTelegramEvent(event: TelegramEventName, payload?: unknown) {
  for (const listener of listenerRegistry[event]) {
    listener(payload);
  }
}

export function subscribeTelegramEvent(event: TelegramEventName, listener: TelegramEventListener) {
  listenerRegistry[event].add(listener);
  const removeLocal = () => {
    listenerRegistry[event].delete(listener);
  };

  if (eventManagerActive) {
    return removeLocal;
  }

  const removeDirect = telegramClient.onEvent(event, (p) => listener(p));
  return () => {
    removeLocal();
    removeDirect();
  };
}
