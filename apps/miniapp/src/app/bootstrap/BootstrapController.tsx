import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { track } from "@vpn-suite/shared";
import { enrichContextAtAppReady } from "./analyticsContext";
import { BootstrapContextProvider, type BootstrapContextValue } from "./context";
import { useTelegramBackButtonController } from "../../hooks/useTelegramBackButtonController";
import { ONBOARDING_ALLOWED_PATHS } from "./constants";
import { useBootstrapMachine } from "./useBootstrapMachine";
import { BootErrorScreen, BootLoadingScreen, BrandSplashScreen } from "./BootScreens";

function isOnboardingAllowedPath(pathname: string): boolean {
  if (pathname.startsWith("/mock")) return true;
  if (ONBOARDING_ALLOWED_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/plan/checkout/")) return true;
  return false;
}

export function BootstrapController({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { initData, isInsideTelegram } = useTelegramWebApp();
  const machine = useBootstrapMachine({ initData, isInsideTelegram });
  const {
    phase,
    session,
    onboardingStep,
    onboardingVersion,
    onboardingError,
    isCompletingOnboarding,
    setOnboardingStep,
    completeOnboarding,
    slowNetwork,
    retry,
    startupError,
  } = machine;

  const recommendedRouteRedirectDone = useRef(false);

  const handleOnboardingBack = useCallback(() => {
    if (onboardingStep <= 0) return;
    void setOnboardingStep(onboardingStep - 1);
  }, [onboardingStep, setOnboardingStep]);

  useTelegramBackButtonController({
    phase,
    onboardingStep,
    onOnboardingBack: handleOnboardingBack,
  });

  useEffect(() => {
    if (phase === "onboarding" && !isOnboardingAllowedPath(location.pathname)) {
      navigate("/onboarding", { replace: true });
      return;
    }
    if (phase === "app_ready" && location.pathname === "/onboarding") {
      const target = session?.routing?.recommended_route ?? "/";
      navigate(target, { replace: true });
      return;
    }
    if (
      phase === "app_ready" &&
      location.pathname === "/" &&
      !recommendedRouteRedirectDone.current
    ) {
      const recommended = session?.routing?.recommended_route;
      if (recommended && recommended !== "/") {
        recommendedRouteRedirectDone.current = true;
        navigate(recommended, { replace: true });
      }
    }
  }, [location.pathname, navigate, phase, session?.routing?.recommended_route]);

  const readyTracked = useRef(false);
  useEffect(() => {
    if (phase === "app_ready" && !readyTracked.current) {
      readyTracked.current = true;
      enrichContextAtAppReady();
      track("miniapp.ready", {});
    }
  }, [phase]);

  const contextValue = useMemo<BootstrapContextValue>(
    () => ({
      phase,
      onboardingStep,
      onboardingVersion,
      onboardingError,
      isCompletingOnboarding,
      setOnboardingStep,
      completeOnboarding,
    }),
    [
      completeOnboarding,
      isCompletingOnboarding,
      onboardingError,
      onboardingStep,
      onboardingVersion,
      phase,
      setOnboardingStep,
    ],
  );

  if (
    phase === "boot_init" ||
    phase === "telegram_ready" ||
    phase === "authenticating" ||
    phase === "loading_session"
  ) {
    return <BootLoadingScreen slowNetwork={slowNetwork} onRetry={retry} />;
  }

  if (phase === "startup_error") {
    return (
      <BootErrorScreen
        title={startupError?.title ?? "Session error"}
        message={startupError?.message ?? "Please try again."}
        debug={startupError?.debug}
        onRetry={retry}
      />
    );
  }

  if (phase === "splash_visible") {
    return <BrandSplashScreen />;
  }

  if (phase === "onboarding" && !isOnboardingAllowedPath(location.pathname)) {
    return <BootLoadingScreen slowNetwork={false} onRetry={retry} />;
  }

  return <BootstrapContextProvider value={contextValue}>{children}</BootstrapContextProvider>;
}
