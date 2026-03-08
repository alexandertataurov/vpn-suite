import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useViewportDimensions, type SafeAreaInsets } from "../hooks/useViewportDimensions";
import { useTelegramApp } from "../hooks/telegram";

export type TelegramContextValue = {
  viewportHeight: number;
  safeAreaInsets: SafeAreaInsets;
  isFullscreen: boolean;
};

const defaultValue: TelegramContextValue = {
  viewportHeight: 0,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  isFullscreen: true,
};

const TelegramContext = createContext<TelegramContextValue>(defaultValue);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { viewportHeight, safeAreaInsets } = useViewportDimensions();
  const { isFullscreen, platform } = useTelegramApp();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const platformTag = platform === "ios" ? "ios" : platform === "android" ? "android" : "other";
    root.dataset.tgFullscreen = isFullscreen ? "true" : "false";
    root.dataset.tgPlatform = platformTag;
    root.dataset.tgDesktop = platform === "desktop" ? "true" : "false";
    return () => {
      delete root.dataset.tgFullscreen;
      delete root.dataset.tgPlatform;
      delete root.dataset.tgDesktop;
    };
  }, [isFullscreen, platform]);

  const value = useMemo<TelegramContextValue>(
    () => ({
      viewportHeight,
      safeAreaInsets,
      isFullscreen,
    }),
    [isFullscreen, viewportHeight, safeAreaInsets],
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
