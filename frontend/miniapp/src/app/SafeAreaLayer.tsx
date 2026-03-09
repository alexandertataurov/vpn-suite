import type { ReactNode } from "react";

export interface SafeAreaLayerProps {
  children: ReactNode;
}

/**
 * Production layer: physical screen protection (notch, gesture bars).
 * Safe-area values come from useViewportDimensions (TelegramProvider), which sets
 * --safe-top, --safe-bottom, etc. on document.documentElement.
 * Layout CSS (shell/header/main/nav) consumes --safe-* vars from this layer.
 */
export function SafeAreaLayer({ children }: SafeAreaLayerProps) {
  return (
    <div className="safe-area-layer tg-safe-area-layer" data-layer="SafeAreaLayer">
      {children}
    </div>
  );
}
