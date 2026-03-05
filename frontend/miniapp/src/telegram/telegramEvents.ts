import { telegramClient, type TelegramEventName } from "./telegramClient";

type EventListener = () => void;

const listenerRegistry: Record<TelegramEventName, Set<EventListener>> = {
  themeChanged: new Set<EventListener>(),
  viewportChanged: new Set<EventListener>(),
  safeAreaChanged: new Set<EventListener>(),
  contentSafeAreaChanged: new Set<EventListener>(),
  fullscreenChanged: new Set<EventListener>(),
  mainButtonClicked: new Set<EventListener>(),
  backButtonClicked: new Set<EventListener>(),
  invoiceClosed: new Set<EventListener>(),
  popupClosed: new Set<EventListener>(),
  qrTextReceived: new Set<EventListener>(),
};

let eventManagerActive = false;

export function setTelegramEventManagerActive(active: boolean) {
  eventManagerActive = active;
}

export function emitTelegramEvent(event: TelegramEventName) {
  for (const listener of listenerRegistry[event]) {
    listener();
  }
}

export function subscribeTelegramEvent(event: TelegramEventName, listener: EventListener) {
  listenerRegistry[event].add(listener);
  const removeLocal = () => {
    listenerRegistry[event].delete(listener);
  };

  if (eventManagerActive) {
    return removeLocal;
  }

  const removeDirect = telegramClient.onEvent(event, listener);
  return () => {
    removeLocal();
    removeDirect();
  };
}

