import { useEffect } from "react";
import { useTheme } from "@vpn-suite/shared/theme";

type TgThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
};

type TgWebAppExtended = {
  colorScheme?: "light" | "dark";
  themeParams?: TgThemeParams;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
};

export function TelegramThemeBridge() {
  const { theme, setTheme, themes } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as Window & { Telegram?: { WebApp?: TgWebAppExtended } }).Telegram?.WebApp;
    if (!tg) return;
    document.documentElement.setAttribute("data-tg", "true");

    const applyScheme = () => {
      if (theme !== "consumer-dark") setTheme("consumer-dark");
    };

    const applyThemeParams = () => {
      const params = tg.themeParams;
      if (!params) return;
      const root = document.documentElement;
      if (params.bg_color) root.style.setProperty("--tg-theme-bg-color", params.bg_color);
      if (params.text_color) root.style.setProperty("--tg-theme-text-color", params.text_color);
      if (params.hint_color) root.style.setProperty("--tg-theme-hint-color", params.hint_color);
      if (params.link_color) root.style.setProperty("--tg-theme-link-color", params.link_color);
      if (params.button_color) root.style.setProperty("--tg-theme-button-color", params.button_color);
      if (params.button_text_color) root.style.setProperty("--tg-theme-button-text-color", params.button_text_color);
      if (params.secondary_bg_color) root.style.setProperty("--tg-theme-secondary-bg-color", params.secondary_bg_color);
    };

    applyScheme();
    applyThemeParams();

    const handler = () => {
      applyScheme();
      applyThemeParams();
    };
    tg.onEvent?.("themeChanged", handler);
    return () => {
      tg.offEvent?.("themeChanged", handler);
      document.documentElement.removeAttribute("data-tg");
    };
  }, [theme, setTheme]);

  return null;
}

