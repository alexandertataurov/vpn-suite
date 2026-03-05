import { useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useTelegramTheme } from "@/hooks/telegram";

export function TelegramThemeBridge() {
  const { theme, setTheme } = useTheme();
  const { colorScheme } = useTelegramTheme();

  useEffect(() => {
    const targetTheme = colorScheme === "light" ? "consumer-light" : "consumer-dark";
    if (theme !== targetTheme) setTheme(targetTheme);
    document.documentElement.setAttribute("data-tg", "true");
    return () => {
      document.documentElement.removeAttribute("data-tg");
    };
  }, [colorScheme, setTheme, theme]);

  return null;
}

