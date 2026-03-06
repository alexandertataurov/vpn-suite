import type { ReactNode } from "react";

export interface SafeAreaLayerProps {
  children: ReactNode;
}

/**
 * Production layer: physical screen protection (notch, gesture bars).
 * Safe-area insets are applied via layout CSS (--safe-* vars) in shell/header/main/nav.
 */
export function SafeAreaLayer({ children }: SafeAreaLayerProps) {
  return (
    <div className="safe-area-layer tg-safe-area-layer" data-layer="SafeAreaLayer">
      {children}
    </div>
  );
}
