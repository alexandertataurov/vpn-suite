import { useEffect, useState } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";
import type { TelegramInitDataChat, TelegramInitDataUnsafe, TelegramInitDataUser } from "@/telegram/telegram.types";

type TelegramInitDataState = {
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  user: TelegramInitDataUser | undefined;
  chat: TelegramInitDataChat | undefined;
  startParam: string;
  isInsideTelegram: boolean;
};

function getStartParamFromUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const fromSearch = new URLSearchParams(window.location.search).get("tgWebAppStartParam") ?? "";
    if (fromSearch) return fromSearch;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(hash).get("tgWebAppStartParam") ?? "";
  } catch {
    return "";
  }
}

function readState(): TelegramInitDataState {
  const initDataUnsafe = telegramClient.getInitDataUnsafe();
  const fromUnsafe =
    typeof initDataUnsafe.start_param === "string" ? initDataUnsafe.start_param : "";
  const fromUrl = getStartParamFromUrl();
  const startParam = fromUnsafe || fromUrl;
  return {
    initData: telegramClient.getInitData(),
    initDataUnsafe,
    user: initDataUnsafe.user,
    chat: initDataUnsafe.chat,
    startParam,
    isInsideTelegram: telegramClient.isInsideTelegram(),
  };
}

export function useTelegramInitData() {
  const [state, setState] = useState<TelegramInitDataState>(() => readState());

  useEffect(() => {
    if (state.initData) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const nextState = readState();
      if (nextState.initData || attempts >= 10) {
        setState(nextState);
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [state.initData]);

  return state;
}
