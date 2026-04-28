import { useEffect, useState } from "react";
import { telegramClient } from "@/lib/telegram/telegramCoreClient";
import type { TelegramInitDataChat, TelegramInitDataUnsafe, TelegramInitDataUser } from "@/lib/telegram/telegram.types";

const INIT_DATA_POLL_INTERVAL_MS = 250;
const INIT_DATA_MAX_WAIT_MS = 5_000;

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

/**
 * Read Telegram WebApp init data and related state.
 * Polls every 100ms up to 10 times when initData is empty — known Telegram quirk where
 * initData may arrive slightly after script load. If Telegram never provides initData,
 * caller sees empty string after ~1s and BootstrapController shows startup_error.
 */
export function useTelegramInitData() {
  const [state, setState] = useState<TelegramInitDataState>(() => readState());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncState = () => {
      setState((current) => {
        const nextState = readState();
        const unchanged =
          current.initData === nextState.initData &&
          current.startParam === nextState.startParam &&
          current.isInsideTelegram === nextState.isInsideTelegram &&
          current.user === nextState.user &&
          current.chat === nextState.chat &&
          current.initDataUnsafe === nextState.initDataUnsafe;
        return unchanged ? current : nextState;
      });
    };

    syncState();

    if (state.initData) {
      window.addEventListener("focus", syncState);
      window.addEventListener("pageshow", syncState);
      document.addEventListener("visibilitychange", syncState);
      return () => {
        window.removeEventListener("focus", syncState);
        window.removeEventListener("pageshow", syncState);
        document.removeEventListener("visibilitychange", syncState);
      };
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const nextState = readState();
      setState(nextState);
      if (nextState.initData || Date.now() - startedAt >= INIT_DATA_MAX_WAIT_MS) {
        window.clearInterval(timer);
      }
    }, INIT_DATA_POLL_INTERVAL_MS);

    window.addEventListener("focus", syncState);
    window.addEventListener("pageshow", syncState);
    document.addEventListener("visibilitychange", syncState);

    const rafId = window.requestAnimationFrame(() => {
      const nextState = readState();
      if (nextState.initData) {
        setState(nextState);
      }
    });

    return () => {
      window.clearInterval(timer);
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("focus", syncState);
      window.removeEventListener("pageshow", syncState);
      document.removeEventListener("visibilitychange", syncState);
    };
  }, [state.initData]);

  return state;
}
