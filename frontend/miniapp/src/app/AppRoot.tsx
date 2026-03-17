import { useEffect, useRef, type ReactNode } from "react";
import { initTelegramRuntime } from "../hooks/useTelegramWebApp";
import { telegramClient } from "../telegram/telegramCoreClient";
import {
  getBlockingOverlayCount,
  subscribeToBlockingOverlayChange,
} from "@/design-system/utils/overlayStack";

export interface AppRootProps {
  children: ReactNode;
}

/**
 * Layer 1: Platform init. AppRoot owns Telegram init (ready, expand, fullscreen, viewport).
 * Defer ready() until after first paint so Telegram's placeholder is replaced by our custom
 * loading screen (TelegramLoadingScreen). Per docs: call ready() when essential UI is loaded.
 */
export function AppRoot({ children }: AppRootProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const overlayLockAppliedRef = useRef(false);
  const previousBodyOverflowRef = useRef("");
  const previousBodyTouchActionRef = useRef("");
  const previousHtmlOverflowRef = useRef("");
  const previousHtmlOverscrollBehaviorRef = useRef("");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      initTelegramRuntime();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && telegramClient.isAvailable()) {
        telegramClient.expand();
        if (
          !telegramClient.isDesktop() &&
          typeof telegramClient.getWebApp()?.requestFullscreen === "function"
        ) {
          telegramClient.requestFullscreen();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    const applyOverlayState = (count: number) => {
      const overlayActive = count > 0;
      const root = rootRef.current;
      if (root) {
        root.dataset.overlayActive = overlayActive ? "true" : "false";
        const shellNodes = root.querySelectorAll<HTMLElement>(".miniapp-shell");
        shellNodes.forEach((node) => {
          if (overlayActive) {
            node.setAttribute("inert", "");
            node.setAttribute("aria-hidden", "true");
            return;
          }
          node.removeAttribute("inert");
          node.removeAttribute("aria-hidden");
        });
      }

      if (overlayActive && !overlayLockAppliedRef.current) {
        previousBodyOverflowRef.current = document.body.style.overflow;
        previousBodyTouchActionRef.current = document.body.style.touchAction;
        previousHtmlOverflowRef.current = document.documentElement.style.overflow;
        previousHtmlOverscrollBehaviorRef.current = document.documentElement.style.overscrollBehavior;
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.overscrollBehavior = "none";
        overlayLockAppliedRef.current = true;
      }

      if (!overlayActive && overlayLockAppliedRef.current) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        document.body.style.touchAction = previousBodyTouchActionRef.current;
        document.documentElement.style.overflow = previousHtmlOverflowRef.current;
        document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehaviorRef.current;
        overlayLockAppliedRef.current = false;
      }

      document.body.dataset.overlayActive = overlayActive ? "true" : "false";
      document.documentElement.dataset.overlayActive = overlayActive ? "true" : "false";
    };

    applyOverlayState(getBlockingOverlayCount());
    return subscribeToBlockingOverlayChange((count) => {
      applyOverlayState(count);
    });
  }, []);

  return (
    <div ref={rootRef} className="tg-app-root" data-layer="AppRoot" data-overlay-active="false">
      {children}
    </div>
  );
}
