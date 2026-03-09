import type { ReactNode } from "react";

export interface StickyBottomBarProps {
  children: ReactNode;
  /** Optional class for the bar container */
  className?: string;
}

/**
 * Transactional CTA bar fixed at bottom. Use on Checkout, RestoreAccess.
 * Renders spacer + fixed bar; respects --safe-bottom.
 */
export function StickyBottomBar({ children, className = "" }: StickyBottomBarProps) {
  return (
    <>
      <div
        className="sticky-bottom-bar-spacer"
        aria-hidden
      />
      <div
        className={`sticky-bottom-bar ${className}`.trim()}
        data-layer="StickyBottomBar"
      >
        {children}
      </div>
    </>
  );
}
