import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useViewportDimensions, type SafeAreaInsets } from "../hooks/useViewportDimensions";
import { useTelegramApp } from "../hooks/telegram";
import { useTheme, type Theme } from "@/design-system/theme/ThemeProvider";

export type TelegramContextValue = {
  viewportHeight: number;
  safeAreaInsets: SafeAreaInsets;
  theme: Theme;
  isFullscreen: boolean;
};

const defaultValue: TelegramContextValue = {
  viewportHeight: 0,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  theme: "consumer-dark",
  isFullscreen: true,
};

const TelegramContext = createContext<TelegramContextValue>(defaultValue);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { viewportHeight, safeAreaInsets } = useViewportDimensions();
  const { isFullscreen, platform } = useTelegramApp();
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const platformTag = platform.includes("ios")
      ? "ios"
      : platform.includes("android")
        ? "android"
        : "other";
    root.dataset.tgFullscreen = isFullscreen ? "true" : "false";
    root.dataset.tgPlatform = platformTag;
    return () => {
      delete root.dataset.tgFullscreen;
      delete root.dataset.tgPlatform;
    };
  }, [isFullscreen, platform]);

  const value = useMemo<TelegramContextValue>(
    () => ({
      viewportHeight,
      safeAreaInsets,
      theme,
      isFullscreen,
    }),
    [isFullscreen, viewportHeight, safeAreaInsets, theme],
  );
  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}
