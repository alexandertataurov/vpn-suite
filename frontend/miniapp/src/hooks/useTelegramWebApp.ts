import { useEffect, useState } from "react";

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

export function useTelegramWebApp() {
  const [initData, setInitData] = useState("");
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;

    let urlInitData = "";
    const searchParams = new URLSearchParams(window.location.search);
    urlInitData = searchParams.get("tgWebAppData") ?? "";

    if (!urlInitData && window.location.hash.includes("tgWebAppData=")) {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      urlInitData = hashParams.get("tgWebAppData") ?? "";
    }

    const finalInitData = tg?.initData || urlInitData || "";

    setInitData(finalInitData);
    setIsInsideTelegram(!!(tg || urlInitData));

    tg?.ready?.();
  }, []);

  const openLink = (url: string) => {
    if (typeof window === "undefined") return;
    const tg = window.Telegram?.WebApp;
    tg?.openLink?.(url);
  };

  return {
    initData,
    isInsideTelegram,
    openLink,
  };
}
