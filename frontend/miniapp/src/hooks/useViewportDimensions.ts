/**
 * Sets Telegram-compatible viewport and safe-area CSS vars on document root.
 * Fixes iOS 100vh bug, address bar collapse, keyboard viewport resize.
 */
import { useEffect } from "react";

export function useViewportDimensions() {
  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
      root.style.setProperty("--tg-viewport-height", `${viewportHeight}px`);
      root.style.setProperty("--app-height", "var(--tg-viewport-height)");
      root.style.setProperty("--safe-top", "env(safe-area-inset-top, 0px)");
      root.style.setProperty("--safe-bottom", "env(safe-area-inset-bottom, 0px)");
      root.style.setProperty("--safe-left", "env(safe-area-inset-left, 0px)");
      root.style.setProperty("--safe-right", "env(safe-area-inset-right, 0px)");
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
    };
  }, []);
}
