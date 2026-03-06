/**
 * Sets Telegram-compatible viewport and safe-area CSS vars on document root.
 * Fixes iOS viewport resize behavior by using Telegram runtime values.
 * Subscribes to Telegram viewport/safe-area events and window resize.
 */
import { useEffect, useMemo } from "react";
import { useSafeAreaInsets } from "./telegram/useSafeAreaInsets";
import { useViewport } from "./telegram/useViewport";

function parsePx(value: string): number {
  return Number.parseFloat(value) || 0;
}

export type SafeAreaInsets = { top: number; bottom: number; left: number; right: number };

function fallbackInsetsFromCss(): SafeAreaInsets {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  return {
    top: parsePx(cs.getPropertyValue("--safe-top").trim()),
    bottom: parsePx(cs.getPropertyValue("--safe-bottom").trim()),
    left: parsePx(cs.getPropertyValue("--safe-left").trim()),
    right: parsePx(cs.getPropertyValue("--safe-right").trim()),
  };
}

export function useViewportDimensions() {
  const { viewportHeight, viewportStableHeight } = useViewport();
  const { safeAreaInset, contentSafeAreaInset } = useSafeAreaInsets();

  const safeAreaInsets = useMemo<SafeAreaInsets>(() => {
    const merged: SafeAreaInsets = {
      top: contentSafeAreaInset.top || safeAreaInset.top,
      bottom: contentSafeAreaInset.bottom || safeAreaInset.bottom,
      left: contentSafeAreaInset.left || safeAreaInset.left,
      right: contentSafeAreaInset.right || safeAreaInset.right,
    };
    if (merged.top || merged.bottom || merged.left || merged.right) return merged;
    if (typeof window === "undefined") return merged;
    return fallbackInsetsFromCss();
  }, [contentSafeAreaInset, safeAreaInset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--tg-viewport-height", `${viewportHeight}px`);
    root.style.setProperty("--tg-viewport-stable-height", `${viewportStableHeight}px`);
    root.style.setProperty("--app-height", "var(--tg-viewport-height)");
    root.style.setProperty("--app-height-stable", "var(--tg-viewport-stable-height)");

    if (safeAreaInsets.top || safeAreaInsets.bottom || safeAreaInsets.left || safeAreaInsets.right) {
      root.style.setProperty("--safe-top", `${safeAreaInsets.top}px`);
      root.style.setProperty("--safe-bottom", `${safeAreaInsets.bottom}px`);
      root.style.setProperty("--safe-left", `${safeAreaInsets.left}px`);
      root.style.setProperty("--safe-right", `${safeAreaInsets.right}px`);
      return;
    }

    root.style.setProperty("--safe-top", "env(safe-area-inset-top, 0px)");
    root.style.setProperty("--safe-bottom", "env(safe-area-inset-bottom, 0px)");
    root.style.setProperty("--safe-left", "env(safe-area-inset-left, 0px)");
    root.style.setProperty("--safe-right", "env(safe-area-inset-right, 0px)");
  }, [safeAreaInsets, viewportHeight, viewportStableHeight]);

  return { viewportHeight, safeAreaInsets };
}
