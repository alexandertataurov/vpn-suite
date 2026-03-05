import { useEffect, type ReactNode } from "react";
import { initTelegramRuntime } from "../hooks/useTelegramWebApp";

export interface AppRootProps {
  children: ReactNode;
}

/**
 * Production layer: Telegram boot. Initializes WebApp and viewport binding.
 * Viewport/safe-area sync runs inside TelegramProvider.
 */
export function AppRoot({ children }: AppRootProps) {
  useEffect(() => {
    initTelegramRuntime();
  }, []);
  return (
    <div className="tg-app-root" data-layer="AppRoot">
      {children}
    </div>
  );
}
