import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { BootPhase } from "../bootstrap/useBootstrapMachine";

const ROOT_ROUTES = new Set(["/", "/devices", "/plan", "/support", "/settings"]);

function isStackRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/plan/checkout/") ||
    pathname === "/servers" ||
    pathname === "/referral"
  );
}

type TgBackButton = {
  show: () => void;
  hide: () => void;
  onClick?: (cb: () => void) => void;
  offClick?: (cb: () => void) => void;
};

function getBackButton(): TgBackButton | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Telegram?: { WebApp?: { BackButton?: TgBackButton } } }).Telegram?.WebApp
    ?.BackButton;
}

interface UseTelegramBackButtonControllerOptions {
  phase: BootPhase;
  onboardingStep: number;
  onOnboardingBack: () => void;
}

export function useTelegramBackButtonController({
  phase,
  onboardingStep,
  onOnboardingBack,
}: UseTelegramBackButtonControllerOptions) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const bb = getBackButton();
    if (!bb) return;

    let handler: (() => void) | undefined;
    const pathname = location.pathname;

    const shouldHideForStartup =
      phase === "boot_init" ||
      phase === "telegram_ready" ||
      phase === "authenticating" ||
      phase === "loading_session" ||
      phase === "splash_visible" ||
      phase === "startup_error";

    if (shouldHideForStartup) {
      bb.hide();
      return;
    }

    if (phase === "onboarding" && pathname === "/onboarding") {
      if (onboardingStep > 0) {
        handler = onOnboardingBack;
        bb.show();
        bb.onClick?.(handler);
      } else {
        bb.hide();
      }
      return () => {
        if (handler) bb.offClick?.(handler);
        bb.hide();
      };
    }

    if (ROOT_ROUTES.has(pathname)) {
      bb.hide();
      return;
    }

    if (isStackRoute(pathname)) {
      handler = () => navigate(-1);
      bb.show();
      bb.onClick?.(handler);
      return () => {
        if (handler) bb.offClick?.(handler);
        bb.hide();
      };
    }

    bb.hide();
    return;
  }, [location.pathname, navigate, onOnboardingBack, onboardingStep, phase]);
}
