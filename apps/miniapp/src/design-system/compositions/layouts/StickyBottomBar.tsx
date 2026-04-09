import type { ReactNode } from "react";

import { useEffect, useState } from "react";

export interface StickyBottomBarProps {
  children: ReactNode;
  /** Optional class for the bar container */
  className?: string;
  visible?: boolean;
}

/**
 * Transactional CTA bar fixed at bottom. Use on Checkout, RestoreAccess.
 * Renders spacer + fixed bar; respects --safe-bottom.
 */
export function StickyBottomBar({ children, className = "", visible = true }: StickyBottomBarProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div
        className="sticky-bottom-bar-spacer"
        aria-hidden
      />
      <div
        className={`sticky-bottom-bar ${className}`.trim()}
        data-layer="StickyBottomBar"
        data-ready={ready ? "true" : "false"}
        data-visible={visible ? "true" : "false"}
      >
        {children}
      </div>
    </>
  );
}
