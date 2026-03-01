import { useEffect } from "react";
import { useTheme } from "@vpn-suite/shared/theme";

type TgWebAppExtended = {
  colorScheme?: "light" | "dark";
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
};

export function TelegramThemeBridge() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as Window & { Telegram?: { WebApp?: TgWebAppExtended } }).Telegram?.WebApp;
    if (!tg) return;
    document.documentElement.setAttribute("data-tg", "true");

    const applyScheme = () => {
      if (theme !== "consumer-dark") setTheme("consumer-dark");
    };

    applyScheme();

    const handler = () => {
      applyScheme();
    };
    tg.onEvent?.("themeChanged", handler);
    return () => {
      tg.offEvent?.("themeChanged", handler);
      document.documentElement.removeAttribute("data-tg");
    };
  }, [theme, setTheme]);

  return null;
}
