import { useEffect, useState } from "react";
import { telegramClient } from "@/telegram/telegramClient";

type TelegramUser = Record<string, unknown> | undefined;
type TelegramChat = Record<string, unknown> | undefined;

type TelegramInitDataState = {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  user: TelegramUser;
  chat: TelegramChat;
  startParam: string;
  isInsideTelegram: boolean;
};

function readState(): TelegramInitDataState {
  const initDataUnsafe = telegramClient.getInitDataUnsafe();
  return {
    initData: telegramClient.getInitData(),
    initDataUnsafe,
    user: initDataUnsafe.user,
    chat: initDataUnsafe.chat,
    startParam: typeof initDataUnsafe.start_param === "string" ? initDataUnsafe.start_param : "",
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

