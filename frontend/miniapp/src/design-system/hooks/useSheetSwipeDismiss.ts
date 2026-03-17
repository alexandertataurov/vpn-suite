import { useCallback, useRef, useState } from "react";
import { useTelegramHaptics } from "@/hooks";

const SWIPE_DISMISS_DISTANCE_PX = 56;
const SWIPE_DISMISS_VELOCITY_PX_PER_S = 520;
const SWIPE_MAX_OFFSET_PX = 160;
const SWIPE_VERTICAL_LOCK_RATIO = 1.1;
const INTERACTIVE_GESTURE_SELECTOR =
  'button, [href], input, select, textarea, label, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"], [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="switch"], [role="tab"]';

interface SheetSwipeStartContext {
  allowStart: boolean;
  scrollElement?: HTMLElement | null;
}

interface UseSheetSwipeDismissOptions {
  enabled: boolean;
  onDismiss: () => void;
  resolveStartContext: (target: HTMLElement | null) => SheetSwipeStartContext;
  dismissDistance?: number;
  dismissVelocity?: number;
  maxOffset?: number;
  verticalLockRatio?: number;
}

interface SheetSwipeDismissResult {
  bind: {
    onTouchStart: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: (event: React.TouchEvent<HTMLElement>) => void;
    onTouchCancel: () => void;
  };
  isDragging: boolean;
  isReady: boolean;
  offset: number;
  reset: () => void;
}

function isInteractiveGestureTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_GESTURE_SELECTOR) !== null;
}

export function useSheetSwipeDismiss({
  enabled,
  onDismiss,
  resolveStartContext,
  dismissDistance = SWIPE_DISMISS_DISTANCE_PX,
  dismissVelocity = SWIPE_DISMISS_VELOCITY_PX_PER_S,
  maxOffset = SWIPE_MAX_OFFSET_PX,
  verticalLockRatio = SWIPE_VERTICAL_LOCK_RATIO,
}: UseSheetSwipeDismissOptions): SheetSwipeDismissResult {
  const { impact, selectionChanged } = useTelegramHaptics();
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const readyRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const reset = useCallback(() => {
    startXRef.current = null;
    startYRef.current = null;
    startTimeRef.current = null;
    scrollElementRef.current = null;
    readyRef.current = false;
    setOffset(0);
    setIsDragging(false);
    setIsReady(false);
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLElement>) => {
    if (!enabled || event.touches.length !== 1) {
      return;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (isInteractiveGestureTarget(target)) {
      return;
    }

    const context = resolveStartContext(target);
    if (!context.allowStart) {
      return;
    }

    if ((context.scrollElement?.scrollTop ?? 0) > 0) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startTimeRef.current = performance.now();
    scrollElementRef.current = context.scrollElement ?? null;
    readyRef.current = false;
    setOffset(0);
    setIsDragging(false);
    setIsReady(false);
  }, [enabled, resolveStartContext]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLElement>) => {
    if (
      !enabled ||
      startXRef.current == null ||
      startYRef.current == null ||
      startTimeRef.current == null ||
      event.touches.length !== 1
    ) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    if (deltaY <= 0) {
      reset();
      return;
    }

    if (Math.abs(deltaX) > deltaY * verticalLockRatio) {
      reset();
      return;
    }

    if ((scrollElementRef.current?.scrollTop ?? 0) > 0) {
      reset();
      return;
    }

    const nextOffset = Math.min(deltaY, maxOffset);
    const nextReady = nextOffset >= dismissDistance;
    setOffset(nextOffset);
    setIsDragging(true);
    setIsReady(nextReady);
    if (nextReady && !readyRef.current) {
      selectionChanged();
    }
    readyRef.current = nextReady;

    if (event.cancelable) {
      event.preventDefault();
    }
  }, [dismissDistance, enabled, maxOffset, reset, selectionChanged, verticalLockRatio]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLElement>) => {
    if (
      !enabled ||
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

    const deltaY = touch.clientY - startYRef.current;
    const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
    const velocity = (deltaY / elapsed) * 1000;
    const shouldDismiss =
      deltaY >= dismissDistance ||
      (deltaY >= 18 && velocity >= dismissVelocity);

    reset();

    if (shouldDismiss) {
      impact("light");
      onDismiss();
    }
  }, [dismissDistance, dismissVelocity, enabled, impact, onDismiss, reset]);

  return {
    bind: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: reset,
    },
    isDragging,
    isReady,
    offset,
    reset,
  };
}
