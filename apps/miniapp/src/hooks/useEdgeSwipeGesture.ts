import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { hasBlockingOverlayOpen } from "@/design-system/utils/overlayStack";
import { telegramClient } from "@/telegram/telegramCoreClient";

interface UseEdgeSwipeGestureOptions {
  enabled?: boolean;
  edgeStartThreshold?: number;
  minHorizontalTravel?: number;
  commitDistance?: number;
  velocityThreshold?: number;
}

interface EdgeSwipeGestureState {
  isTracking: boolean;
  isReady: boolean;
  progress: number;
}

const EDGE_START_THRESHOLD_PX = 28;
const MIN_HORIZONTAL_TRAVEL_PX = 18;
const COMMIT_DISTANCE_PX = 92;
const VELOCITY_THRESHOLD_PX_PER_MS = 0.55;
const HORIZONTAL_LOCK_RATIO = 1.2;
const INTERACTIVE_TARGET_SELECTOR = [
  "a",
  "button",
  "input",
  "label",
  "select",
  "summary",
  "textarea",
  "[contenteditable='true']",
  "[data-no-edge-swipe='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='link']",
  "[role='switch']",
  "[role='tab']",
].join(", ");

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
}

/**
 * Mobile-only edge swipe gesture. Intended for stack navigation where tap back
 * remains available as the primary accessible fallback.
 */
export function useEdgeSwipeGesture(
  containerRef: RefObject<HTMLElement | null>,
  onCommit: () => void,
  options: UseEdgeSwipeGestureOptions = {},
): EdgeSwipeGestureState {
  const enabled = options.enabled ?? true;
  const edgeStartThreshold = options.edgeStartThreshold ?? EDGE_START_THRESHOLD_PX;
  const minHorizontalTravel = options.minHorizontalTravel ?? MIN_HORIZONTAL_TRAVEL_PX;
  const commitDistance = options.commitDistance ?? COMMIT_DISTANCE_PX;
  const velocityThreshold = options.velocityThreshold ?? VELOCITY_THRESHOLD_PX_PER_MS;
  const platform = useMemo(() => telegramClient.getPlatform(), []);

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const trackingRef = useRef(false);
  const activeRef = useRef(false);
  const [gestureState, setGestureState] = useState<EdgeSwipeGestureState>({
    isTracking: false,
    isReady: false,
    progress: 0,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !enabled || platform === "desktop") return;

    const reset = () => {
      startXRef.current = null;
      startYRef.current = null;
      startTimeRef.current = null;
      trackingRef.current = false;
      activeRef.current = false;
      setGestureState({
        isTracking: false,
        isReady: false,
        progress: 0,
      });
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      if (hasBlockingOverlayOpen()) return;
      const touch = event.touches[0];
      if (!touch) return;
      if (touch.clientX > edgeStartThreshold) return;
      if (isInteractiveTarget(event.target)) return;

      trackingRef.current = true;
      activeRef.current = false;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      startTimeRef.current = performance.now();
      setGestureState({
        isTracking: true,
        isReady: false,
        progress: 0,
      });
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!trackingRef.current || startXRef.current == null || startYRef.current == null) return;
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      if (deltaX <= 0) {
        reset();
        return;
      }

      if (!activeRef.current) {
        if (Math.abs(deltaY) > deltaX * HORIZONTAL_LOCK_RATIO) {
          reset();
          return;
        }
        if (deltaX < minHorizontalTravel) {
          return;
        }
        activeRef.current = true;
      }

      const progress = Math.min(deltaX / commitDistance, 1);
      setGestureState({
        isTracking: true,
        isReady: progress >= 1,
        progress,
      });

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (
        !trackingRef.current ||
        startXRef.current == null ||
        startYRef.current == null ||
        startTimeRef.current == null
      ) {
        reset();
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        reset();
        return;
      }

      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;
      const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
      const velocity = deltaX / elapsed;
      const horizontalDominance = deltaX > 0 && Math.abs(deltaY) <= deltaX / HORIZONTAL_LOCK_RATIO;
      const shouldCommit =
        horizontalDominance &&
        (deltaX >= commitDistance || (activeRef.current && velocity >= velocityThreshold));

      reset();

      if (shouldCommit) {
        onCommit();
      }
    };

    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    node.addEventListener("touchend", handleTouchEnd, { passive: true });
    node.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      node.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [
    commitDistance,
    containerRef,
    edgeStartThreshold,
    enabled,
    minHorizontalTravel,
    onCommit,
    platform,
    velocityThreshold,
  ]);

  return gestureState;
}
