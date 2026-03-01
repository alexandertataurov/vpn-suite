import { useMemo } from "react";
let telegramRuntimeInitialized = false;

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready?: () => void;
        openLink?: (url: string) => void;
      };
    };
  }
}

function getInitDataSync(): { initData: string; isInsideTelegram: boolean } {
  if (typeof window === "undefined") return { initData: "", isInsideTelegram: false };
  const tg = window.Telegram?.WebApp;
  let urlInitData = "";
  try {
    urlInitData = new URLSearchParams(window.location.search).get("tgWebAppData") ?? "";
    if (!urlInitData && window.location.hash.includes("tgWebAppData=")) {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      urlInitData = new URLSearchParams(hash).get("tgWebAppData") ?? "";
    }
  } catch {
    /* ignore */
  }
  const initData = tg?.initData || urlInitData || "";
  return { initData, isInsideTelegram: !!(tg || urlInitData) };
}

export function useTelegramWebApp() {
  const state = useMemo(getInitDataSync, []);

  const openLink = (url: string) => {
    if (typeof window === "undefined") return;
    const tg = window.Telegram?.WebApp;
    tg?.openLink?.(url);
  };

  return {
    initData: state.initData ?? "",
    isInsideTelegram: !!state.isInsideTelegram,
    openLink,
  };
}

export function initTelegramRuntime() {
  if (typeof window === "undefined") return;
  if (telegramRuntimeInitialized) return;
  telegramRuntimeInitialized = true;
  const tg = window.Telegram?.WebApp as { ready?: () => void; expand?: () => void } | undefined;
  tg?.ready?.();
  tg?.expand?.();
}
