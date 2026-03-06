import { useRef } from "react";
import type { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

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
  const pullTier = isRefreshing
    ? "tier-refreshing"
    : pullDistance >= 32
      ? "tier-high"
      : pullDistance >= 16
        ? "tier-mid"
        : pullDistance > 0
          ? "tier-low"
          : "tier-idle";

  return (
    <main ref={scrollRef} className={className} data-layer="ScrollZone">
      <div
        className={`miniapp-ptr-indicator ${pullTier} ${isReady ? "is-ready" : ""} ${isRefreshing ? "is-refreshing" : ""}`}
        aria-hidden
      >
        <span className="miniapp-ptr-spinner" />
        <span className="miniapp-ptr-text">
          {isRefreshing ? "Refreshing" : isReady ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>
      <div className={`miniapp-scroll-content ${pullTier}`}>
        {children}
      </div>
    </main>
  );
}
