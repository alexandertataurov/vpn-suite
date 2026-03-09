import { useEffect, type ReactNode } from "react";
import { initTelegramRuntime } from "../hooks/useTelegramWebApp";
import { telegramClient } from "../telegram/telegramCoreClient";

export interface AppRootProps {
  children: ReactNode;
}

/**
 * Layer 1: Platform init. AppRoot owns Telegram init (ready, expand, fullscreen, viewport).
 * Defer ready() until after first paint so Telegram's placeholder is replaced by our custom
 * loading screen (TelegramLoadingScreen). Per docs: call ready() when essential UI is loaded.
 */
export function AppRoot({ children }: AppRootProps) {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      initTelegramRuntime();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && telegramClient.isAvailable()) {
        telegramClient.expand();
        if (
          !telegramClient.isDesktop() &&
          typeof telegramClient.getWebApp()?.requestFullscreen === "function"
        ) {
          telegramClient.requestFullscreen();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <div className="tg-app-root" data-layer="AppRoot">
      {children}
    </div>
  );
}
