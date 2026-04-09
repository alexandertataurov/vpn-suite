import { useEffect } from "react";
import { useTheme } from "../core/theme";
import { useTelegramTheme } from "@/hooks";
import { telegramClient } from "@/telegram/telegramCoreClient";

export function TelegramThemeBridge() {
  const { theme, setTheme } = useTheme();
  const { colorScheme } = useTelegramTheme();

  useEffect(() => {
    const isTelegram = telegramClient.isAvailable();
    const prefersLight =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: light)")?.matches === true;
    const targetTheme =
      (isTelegram ? colorScheme === "light" : prefersLight)
        ? "consumer-light"
        : "consumer-dark";
    if (theme !== targetTheme) setTheme(targetTheme);
    if (isTelegram) document.documentElement.setAttribute("data-tg", "true");
    else document.documentElement.removeAttribute("data-tg");
  }, [colorScheme, setTheme, theme]);

  useEffect(() => {
    if (typeof window === "undefined" || telegramClient.isAvailable() || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");

    const applyDeviceTheme = (matchesLight: boolean) => {
      const targetTheme = matchesLight ? "consumer-light" : "consumer-dark";
      setTheme(targetTheme);
    };

    applyDeviceTheme(media.matches);
    const onChange = (event: MediaQueryListEvent) => applyDeviceTheme(event.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
    } else {
      media.addListener(onChange);
    }
    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", onChange);
      } else {
        media.removeListener(onChange);
      }
    };
  }, [setTheme]);

  return null;
}
