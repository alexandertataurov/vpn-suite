import { useEffect, useState } from "react";
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
  const [state, setState] = useState(getInitDataSync);

  useEffect(() => {
    if (state.initData) return;
    if (typeof window === "undefined") return;
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    let attempts = 0;
    const maxAttempts = 10;
    const timer = window.setInterval(() => {
      attempts += 1;
      const next = getInitDataSync();
      if (next.initData || attempts >= maxAttempts) {
        setState(next);
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [state.initData]);

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
