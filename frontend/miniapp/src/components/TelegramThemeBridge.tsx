import { useEffect } from "react";
import { useTheme } from "@vpn-suite/shared/theme";

export function TelegramThemeBridge() {
  const { theme, setTheme, themes } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = window.Telegram?.WebApp as
      | (typeof window.Telegram.WebApp & {
          colorScheme?: "light" | "dark";
          onEvent?: (event: string, cb: () => void) => void;
          offEvent?: (event: string, cb: () => void) => void;
        })
      | undefined;
    if (!tg) return;

    const applyScheme = () => {
      const scheme = tg.colorScheme;
      const desired =
        scheme === "dark"
          ? themes.find((t) => t.includes("dark")) ?? "consumer-dark"
          : themes.find((t) => t.includes("light")) ?? "consumer-light";
      if (desired && desired !== theme) {
        setTheme(desired);
      }
    };

    applyScheme();
    const handler = () => applyScheme();
    tg.onEvent?.("themeChanged", handler);
    return () => {
      tg.offEvent?.("themeChanged", handler);
    };
  }, [theme, setTheme, themes]);

  return null;
}

