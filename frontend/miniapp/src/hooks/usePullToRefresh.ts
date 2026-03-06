import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { telegramClient } from "@/telegram/telegramCoreClient";
import { resolvePullToRefreshProfile } from "@/config/pullToRefresh";

interface PullToRefreshOptions {
  threshold?: number;
  maxPull?: number;
  resistance?: number;
}

interface PullToRefreshState {
  pullDistance: number;
  isReady: boolean;
  isRefreshing: boolean;
}

const TOP_EPSILON_PX = 0.5;
const TOP_SETTLE_MS_DEFAULT = 180;
const TOP_SETTLE_MS_IOS = 240;
const TOP_SETTLE_MS_ANDROID = 160;
const UPWARD_SCROLL_LOCK_MS_DEFAULT = 320;
const UPWARD_SCROLL_LOCK_MS_IOS = 420;
const UPWARD_SCROLL_LOCK_MS_ANDROID = 280;
const TOP_START_ZONE_PX = 120;

function isAtTop(node: HTMLElement): boolean {
  return node.scrollTop <= TOP_EPSILON_PX;
}

function resolveTopSettleWindowMs(platform: string): number {
  if (platform.includes("ios")) return TOP_SETTLE_MS_IOS;
  if (platform.includes("android")) return TOP_SETTLE_MS_ANDROID;
  return TOP_SETTLE_MS_DEFAULT;
}

function resolveUpwardScrollLockWindowMs(platform: string): number {
  if (platform.includes("ios")) return UPWARD_SCROLL_LOCK_MS_IOS;
  if (platform.includes("android")) return UPWARD_SCROLL_LOCK_MS_ANDROID;
  return UPWARD_SCROLL_LOCK_MS_DEFAULT;
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void> | void,
  options: PullToRefreshOptions = {},
): PullToRefreshState {
  const platform = useMemo(() => telegramClient.getPlatform(), []);
  const platformProfile = useMemo(
    () => resolvePullToRefreshProfile(platform),
    [platform],
  );
  const topSettleWindowMs = useMemo(() => resolveTopSettleWindowMs(platform), [platform]);
  const upwardScrollLockWindowMs = useMemo(
    () => resolveUpwardScrollLockWindowMs(platform),
    [platform],
  );
  const threshold = options.threshold ?? platformProfile.threshold;
  const maxPull = options.maxPull ?? platformProfile.maxPull;
  const resistance = options.resistance ?? platformProfile.resistance;

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const startScrollTopRef = useRef(0);
  const canPullRef = useRef(false);
  const lastNonTopAtRef = useRef(0);
  const lastUpwardScrollAtRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const draggingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reset = useCallback(() => {
    startYRef.current = null;
    startXRef.current = null;
    startScrollTopRef.current = 0;
    canPullRef.current = false;
    draggingRef.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
    setIsReady(false);
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const anchoredDistance = Math.min(maxPull, threshold * 0.8);
    pullDistanceRef.current = anchoredDistance;
    setPullDistance(anchoredDistance);
    setIsReady(false);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [isRefreshing, maxPull, onRefresh, threshold]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    lastScrollTopRef.current = node.scrollTop;

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshing) return;
      if (event.touches.length !== 1) return;
      if (!isAtTop(node)) return;
      const now = Date.now();
      if (now - lastNonTopAtRef.current < topSettleWindowMs) return;
      if (now - lastUpwardScrollAtRef.current < upwardScrollLockWindowMs) return;
      const touch = event.touches[0];
      if (!touch) return;
      const zoneStartY = touch.clientY - node.getBoundingClientRect().top;
      if (zoneStartY > TOP_START_ZONE_PX) return;
      startYRef.current = touch.clientY;
      startXRef.current = event.touches[0]?.clientX ?? null;
      startScrollTopRef.current = node.scrollTop;
      canPullRef.current = true;
      draggingRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isRefreshing) return;
      if (startYRef.current == null || startXRef.current == null) return;
      if (!canPullRef.current) return;
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touch.clientY - startYRef.current;
      const deltaX = Math.abs(touch.clientX - startXRef.current);

      if (deltaY <= 0 || startScrollTopRef.current > TOP_EPSILON_PX || !isAtTop(node)) {
        if (draggingRef.current) reset();
        return;
      }
      if (deltaX > deltaY) {
        reset();
        return;
      }

      draggingRef.current = true;
      const adjustedPull = Math.min(maxPull, deltaY * resistance);
      const ready = adjustedPull >= threshold;
      pullDistanceRef.current = adjustedPull;
      setPullDistance(adjustedPull);
      setIsReady(ready);
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!draggingRef.current) {
        reset();
        return;
      }
      const shouldRefresh =
        canPullRef.current &&
        pullDistanceRef.current >= threshold &&
        isAtTop(node) &&
        startScrollTopRef.current <= TOP_EPSILON_PX;
      reset();
      if (shouldRefresh) {
        void triggerRefresh();
      }
    };

    const handleScroll = () => {
      const nextTop = node.scrollTop;
      const prevTop = lastScrollTopRef.current;
      if (nextTop + TOP_EPSILON_PX < prevTop) {
        lastUpwardScrollAtRef.current = Date.now();
      }
      if (!isAtTop(node)) {
        lastNonTopAtRef.current = Date.now();
      }
      lastScrollTopRef.current = nextTop;
      if (!canPullRef.current) return;
      if (!isAtTop(node)) {
        // User moved away from the top while gesture is active; cancel pull-refresh.
        reset();
      }
    };

    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    node.addEventListener("touchend", handleTouchEnd, { passive: true });
    node.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    node.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      node.removeEventListener("touchcancel", handleTouchEnd);
      node.removeEventListener("scroll", handleScroll);
    };
  }, [
    containerRef,
    isRefreshing,
    maxPull,
    reset,
    resistance,
    threshold,
    topSettleWindowMs,
    triggerRefresh,
    upwardScrollLockWindowMs,
  ]);

  return useMemo(
    () => ({ pullDistance, isReady, isRefreshing }),
    [isReady, isRefreshing, pullDistance],
  );
}
