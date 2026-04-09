import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTelegramHaptics, useEdgeSwipeGesture } from "@/hooks";

export interface ShellContextBlockProps {
  stackFlow?: boolean;
  gestureRef?: RefObject<HTMLElement | null>;
}

type HeaderAction = "back" | null;
const EMPTY_GESTURE_REF: RefObject<HTMLElement | null> = { current: null };

function resolveHeaderAction(pathname: string, stackFlow: boolean): HeaderAction {
  if (!stackFlow) return null;
  if (pathname === "/") return null;
  if (pathname === "/onboarding") return null;
  return "back";
}

function getFallbackRoute(pathname: string): string {
  if (pathname.startsWith("/plan/checkout/")) return "/plan";
  if (pathname === "/devices/issue") return "/devices";
  return "/";
}

export function ShellContextBlock({ stackFlow = false, gestureRef }: ShellContextBlockProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { impact, selectionChanged } = useTelegramHaptics();
  const action = resolveHeaderAction(location.pathname, stackFlow);
  const backState = (location.state as { from?: string } | null) ?? null;

  const handleAction = useCallback(() => {
    if (!action) return;
    impact("light");

    if (typeof backState?.from === "string" && backState.from && backState.from !== location.pathname) {
      navigate(backState.from);
      return;
    }
    if (typeof window !== "undefined" && window.history.length <= 1) {
      navigate(getFallbackRoute(location.pathname), { replace: true });
      return;
    }
    navigate(-1);
  }, [action, backState?.from, impact, location.pathname, navigate]);

  const gestureState = useEdgeSwipeGesture(gestureRef ?? EMPTY_GESTURE_REF, handleAction, {
    enabled: action === "back",
  });

  useEffect(() => {
    if (gestureState.isReady) {
      selectionChanged();
    }
  }, [gestureState.isReady, selectionChanged]);

  useEffect(() => {
    sectionRef.current?.style.setProperty(
      "--miniapp-shell-gesture-progress",
      `${gestureState.progress}`,
    );
  }, [gestureState.progress]);

  if (!action) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="miniapp-shell-context miniapp-shell-context--gesture-only"
      aria-label="Navigation and status"
      data-gesture-active={gestureState.isTracking ? "true" : "false"}
      data-gesture-ready={gestureState.isReady ? "true" : "false"}
    >
      <div className="miniapp-shell-context-gesture-indicator" aria-hidden={!gestureState.isTracking}>
        {gestureState.isReady ? "Release to go back" : "Swipe right to go back"}
      </div>
    </section>
  );
}
