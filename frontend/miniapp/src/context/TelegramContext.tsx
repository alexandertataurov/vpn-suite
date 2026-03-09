import { useEffect, type ReactNode } from "react";
import { useViewportDimensions } from "../hooks/useViewportDimensions";
import { useTelegramApp } from "../hooks/telegram";

/**
 * Side-effect provider: wires viewport/safe-area CSS vars (via useViewportDimensions)
 * and data-tg* attributes on document root for platform-based styling.
 * No context value; use useTelegramApp / useViewportDimensions directly for viewport/safe-area/fullscreen.
 */
export function TelegramProvider({ children }: { children: ReactNode }) {
  useViewportDimensions(); // sets --tg-viewport-height, --safe-* CSS vars
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

  return <>{children}</>;
}
