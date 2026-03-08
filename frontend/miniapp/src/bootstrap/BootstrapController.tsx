import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { IconShield } from "@/design-system";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, InlineAlert, Skeleton, Display, Body } from "@/design-system";
import { useTelegramWebApp } from "../hooks/useTelegramWebApp";
import { track } from "@vpn-suite/shared";
import { useTelegramBackButtonController } from "../hooks/useTelegramBackButtonController";
import { useBootstrapMachine, type BootPhase } from "./useBootstrapMachine";

interface BootstrapContextValue {
  phase: BootPhase;
  onboardingStep: number;
  onboardingVersion: number;
  onboardingError: string | null;
  isCompletingOnboarding: boolean;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<{ done: boolean; synced: boolean }>;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

/** Routes onboarding users may visit; they are not forced back to /onboarding on these. */
const ONBOARDING_ALLOWED_PATHS = [
  "/plan",
  "/devices",
  "/devices/issue",
];

function isOnboardingAllowedPath(pathname: string): boolean {
  if (pathname === "/onboarding") return true;
  if (ONBOARDING_ALLOWED_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/plan/checkout/")) return true;
  return false;
}

export function useBootstrapContext(): BootstrapContextValue {
  const context = useContext(BootstrapContext);
  if (!context) {
    throw new Error("useBootstrapContext must be used within BootstrapController");
  }
  return context;
}

function BootLoadingScreen({ slowNetwork, onRetry }: { slowNetwork: boolean; onRetry: () => void }) {
  return (
    <div className="splash-screen splash-screen--loading" role="status" aria-live="polite">
      <div className="splash-screen-content bootstrap-loading-content">
        <span className="splash-screen-logo" aria-hidden>
          <IconShield size={42} strokeWidth={1.5} />
        </span>
        <Skeleton variant="card" className="bootstrap-loading-skeleton" />
        {slowNetwork && (
          <>
            <Body className="splash-screen-tagline">Still connecting. You can retry now.</Body>
            <Button variant="secondary" size="md" onClick={onRetry} aria-label="Retry connection">
              Retry
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function BootErrorScreen({
  title,
  message,
  debug,
  onRetry,
}: {
  title: string;
  message: string;
  debug?: string;
  onRetry: () => void;
}) {
  return (
    <div className="splash-screen" role="region" aria-label="Startup error">
      <div className="splash-screen-content">
        <span className="splash-screen-logo" aria-hidden>
          <IconShield size={42} strokeWidth={1.5} />
        </span>
        <InlineAlert variant="error" title={title} message={message} />
        {debug && (
          <Body as="p" className="splash-screen-tagline">
            Debug: {debug}
          </Body>
        )}
        <Button variant="primary" size="lg" className="splash-screen-cta" onClick={onRetry} aria-label="Retry">
          Retry
        </Button>
      </div>
    </div>
  );
}

function BrandSplashScreen() {
  return (
    <div className="splash-screen" role="region" aria-label="Welcome">
      <div className="splash-screen-content">
        <span className="splash-screen-logo" aria-hidden>
          <IconShield size={48} strokeWidth={1.5} />
        </span>
        <Display as="h1">VPN</Display>
        <Body className="splash-screen-tagline">Secure and private. Starting your onboarding…</Body>
      </div>
    </div>
  );
}

export function BootstrapController({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { initData, isInsideTelegram } = useTelegramWebApp();
  const machine = useBootstrapMachine({ initData, isInsideTelegram });
  const session = machine.session;
  const {
    phase,
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
      const route = session?.routing?.recommended_route ?? "/plan";
      navigate(route, { replace: true });
    }
  }, [location.pathname, navigate, phase, session?.routing?.recommended_route]);

  const readyTracked = useRef(false);
  useEffect(() => {
    if (phase === "app_ready" && !readyTracked.current) {
      readyTracked.current = true;
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

  return <BootstrapContext.Provider value={contextValue}>{children}</BootstrapContext.Provider>;
}
