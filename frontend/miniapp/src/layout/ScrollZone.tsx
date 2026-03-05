import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

/* eslint-disable react/forbid-dom-props */

/**
 * Production layer: only scrollable area. flex: 1; overflow-y: auto.
 */
export function ScrollZone({
  children,
  className,
  onRefresh,
}: {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void> | void;
}) {
  const scrollRef = useRef<HTMLElement | null>(null);
  const { pullDistance, isReady, isRefreshing } = usePullToRefresh(
    scrollRef,
    async () => {
      if (!onRefresh) return;
      await onRefresh();
    },
  );
  const contentStyle: CSSProperties = {
    transform: pullDistance > 0 ? `translateY(${Math.round(pullDistance)}px)` : undefined,
  };
  const indicatorStyle: CSSProperties = {
    height: isRefreshing ? 40 : Math.min(40, Math.round(pullDistance * 0.55)),
  };

  return (
    <main ref={scrollRef} className={className} data-layer="ScrollZone">
      <div
        className={`miniapp-ptr-indicator ${isReady ? "is-ready" : ""} ${isRefreshing ? "is-refreshing" : ""}`}
        style={indicatorStyle}
        aria-hidden
      >
        <span className="miniapp-ptr-spinner" />
        <span className="miniapp-ptr-text">
          {isRefreshing ? "Refreshing" : isReady ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>
      <div className="miniapp-scroll-content" style={contentStyle}>
        {children}
      </div>
    </main>
  );
}
