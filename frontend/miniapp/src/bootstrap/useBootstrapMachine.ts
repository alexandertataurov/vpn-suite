import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, track, trackError, trackTiming, type WebAppMeResponse, type WebAppOnboardingState, type WebAppOnboardingStateRequest, type WebAppOnboardingStateResponse } from "@vpn-suite/shared";
import { setWebappToken, useWebappToken, webappApi } from "../api/client";
import { useSession } from "../hooks/useSession";
import { webappQueryKeys } from "@/lib";
import { authenticateWebApp } from "./authBootstrap";
import {
  clearOnboardingResume,
  loadOnboardingResume,
  saveOnboardingResume,
} from "./bootstrapStorage";
import { ONBOARDING_MAX_STEP, ONBOARDING_MIN_STEP, ONBOARDING_VERSION } from "./constants";

const SPLASH_DURATION_MS = 900;
const STARTUP_SOFT_TIMEOUT_MS = 1_500;

function isAutomatedRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver;
}

export type BootPhase =
  | "boot_init"
  | "telegram_ready"
  | "authenticating"
  | "loading_session"
  | "splash_visible"
  | "onboarding"
  | "app_ready"
  | "startup_error";

// Why: make bootstrap states explicit and exhaustively enumerable for consumers/controllers.
export type BootstrapState =
  | { status: "boot_init" }
  | { status: "telegram_ready" }
  | { status: "authenticating" }
  | { status: "loading_session" }
  | { status: "splash_visible" }
  | { status: "onboarding" }
  | { status: "app_ready" }
  | { status: "startup_error"; error: StartupError };

export interface StartupError {
  title: string;
  message: string;
  debug?: string;
}

/** Structured bootstrap failure for telemetry/Sentry. */
export interface BootstrapFailure {
  phase: BootPhase;
  reason: string;
  debug?: string;
  correlationId?: string;
}

interface UseBootstrapMachineOptions {
  initData: string;
  isInsideTelegram: boolean;
}

export interface BootstrapMachineState {
  state: BootstrapState;
  phase: BootPhase;
  session: WebAppMeResponse | undefined;
  slowNetwork: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
  onboardingVersion: number;
  isCompletingOnboarding: boolean;
  onboardingError: string | null;
  startupError: StartupError | null;
  retry: () => void;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<{ done: boolean; synced: boolean }>;
}

function clampStep(step: number): number {
  return Math.max(ONBOARDING_MIN_STEP, Math.min(ONBOARDING_MAX_STEP, step));
}

function getStartupError(isInsideTelegram: boolean): StartupError {
  if (isInsideTelegram) {
    return {
      title: "Session could not be started",
      message: "Close and reopen the mini app from the Telegram bot.",
    };
  }
  return {
    title: "Open from Telegram",
    message: "Open this app from the Telegram bot to use your VPN subscription.",
  };
}

function getDefaultOnboardingState(): WebAppOnboardingState {
  return {
    completed: false,
    step: 0,
    version: ONBOARDING_VERSION,
    updated_at: null,
  };
}

function hasActiveSubscription(session?: WebAppMeResponse): boolean {
  return (
    session?.subscriptions?.some((subscription) => {
      const subscriptionStatus = subscription.subscription_status ?? subscription.status;
      const accessStatus = subscription.access_status ?? "enabled";
      return subscriptionStatus === "active" && accessStatus === "enabled";
    }) ?? false
  );
}

function hasIssuedDevice(session?: WebAppMeResponse): boolean {
  return session?.devices?.some((device) => !device.revoked_at) ?? false;
}

function shouldExitOnboarding(session?: WebAppMeResponse): boolean {
  return hasActiveSubscription(session) && hasIssuedDevice(session);
}

export function useBootstrapMachine({
  initData,
  isInsideTelegram,
}: UseBootstrapMachineOptions): BootstrapMachineState {
  const splashDurationMs = isAutomatedRuntime() ? 0 : SPLASH_DURATION_MS;
  const hasToken = !!useWebappToken();
  const queryClient = useQueryClient();
  const sessionQuery = useSession(hasToken);
  const [phase, setPhase] = useState<BootPhase>("boot_init");
  const [startupError, setStartupError] = useState<StartupError | null>(null);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingState, setOnboardingState] = useState<WebAppOnboardingState>(
    getDefaultOnboardingState(),
  );
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const onboardingInitialized = useRef(false);
  const currentUserId = useRef<number | null>(null);
  const autoCompletedUserId = useRef<number | null>(null);
  const bootStartRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
  const prevPhaseRef = useRef<BootPhase>("boot_init");

  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      track("miniapp.bootstrap_phase", {
        from: prevPhaseRef.current,
        to: phase,
      });
      prevPhaseRef.current = phase;
      if (phase === "app_ready") {
        const durationMs = typeof performance !== "undefined" ? Math.round(performance.now() - bootStartRef.current) : 0;
        trackTiming("bootstrap_duration", durationMs, { phase: "app_ready" });
      }
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "authenticating" && phase !== "loading_session") {
      setSlowNetwork(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowNetwork(true), STARTUP_SOFT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "splash_visible") return;
    const timer = window.setTimeout(() => {
      setSplashDone(true);
      setPhase("onboarding");
    }, splashDurationMs);
    return () => window.clearTimeout(timer);
  }, [phase, splashDurationMs]);

  useEffect(() => {
    if (!hasToken) {
      onboardingInitialized.current = false;
      currentUserId.current = null;
      autoCompletedUserId.current = null;
    }
  }, [hasToken]);

  const retry = useCallback(() => {
    setStartupError(null);
    setOnboardingError(null);
    setSlowNetwork(false);
    if (!initData) {
      setPhase("boot_init");
      return;
    }
    if (hasToken) {
      setPhase("loading_session");
      void sessionQuery.refetch();
      return;
    }
    setPhase("telegram_ready");
  }, [hasToken, initData, sessionQuery]);

  useEffect(() => {
    if (phase === "startup_error" && initData) {
      retry();
    }
  }, [phase, initData, retry]);

  useEffect(() => {
    if (phase === "boot_init") {
      if (!initData) {
        const err = {
          ...getStartupError(isInsideTelegram),
          debug: `reason=no_init_data isInsideTelegram=${String(isInsideTelegram)}`,
        };
        setStartupError(err);
        trackError(`bootstrap.startup_error: phase=boot_init reason=${err.message}`, {
          route: typeof window !== "undefined" ? window.location.pathname : undefined,
        });
        setPhase("startup_error");
        return;
      }
      setStartupError(null);
      setPhase("telegram_ready");
      return;
    }

    if (phase === "startup_error") return;

    if (phase === "telegram_ready") {
      if (hasToken) {
        setPhase("loading_session");
        return;
      }
      setPhase("authenticating");
      authenticateWebApp(initData)
        .then((res) => {
          setWebappToken(res.session_token, res.expires_in);
          setStartupError(null);
          setPhase("loading_session");
        })
        .catch((err: unknown) => {
          const errObj = err as ApiError | Error | { code?: string; message?: string };
          const isTimeout =
            (errObj as { code?: string })?.code === "TIMEOUT" ||
            (errObj as Error)?.message?.includes("timed out");
          const rawMessage =
            err instanceof ApiError ? err.message : undefined;
          const isInvalidInitData =
            rawMessage?.toLowerCase().includes("initdata") ||
            rawMessage?.toLowerCase().includes("init_data") ||
            (err instanceof ApiError && err.code === "INVALID_INIT_DATA");
          const message = isTimeout
            ? "Request timed out. Try again."
            : isInvalidInitData
              ? "Open this app from the Telegram bot (menu or /start link). If you already did, close and reopen it from the bot."
              : rawMessage ?? "Session could not be started. Please try again.";
          const authErr = {
            title: "Session error",
            message,
            debug: `reason=auth_error code=${(err as ApiError | { code?: string })?.code ?? "n/a"} status=${(err as ApiError | { statusCode?: number })?.statusCode ?? "n/a"} rawMessage=${rawMessage ?? "n/a"} isInsideTelegram=${String(isInsideTelegram)} initDataPresent=${String(!!initData)}`,
          };
          setStartupError(authErr);
          trackError(`bootstrap.startup_error: phase=authenticating reason=${message}`, {
            route: typeof window !== "undefined" ? window.location.pathname : undefined,
          });
          setPhase("startup_error");
        });
      return;
    }

    if (phase === "authenticating") {
      if (hasToken) {
        setPhase("loading_session");
      }
      return;
    }

    if (phase === "loading_session") {
      if (!hasToken) {
        setPhase("telegram_ready");
        return;
      }
      if (sessionQuery.isLoading) return;
      if (sessionQuery.error) {
        const err = sessionQuery.error;
        const isExpired =
          err instanceof ApiError &&
          (err.code === "UNAUTHORIZED" || err.statusCode === 401);
        const sessionErrMsg = isExpired
          ? "Your session expired. Tap Retry to sign in again, or reopen the app from the bot."
          : "Could not load your account. Tap Retry or reopen the mini app from the bot.";
        const sessionErr = {
          title: "Session error",
          message: sessionErrMsg,
          debug: `reason=session_error code=${err instanceof ApiError ? err.code : "n/a"} status=${err instanceof ApiError ? err.statusCode : "n/a"} isExpired=${String(isExpired)} hasToken=${String(hasToken)} initDataPresent=${String(!!initData)} isInsideTelegram=${String(isInsideTelegram)}`,
        };
        setStartupError(sessionErr);
        trackError(`bootstrap.startup_error: phase=loading_session reason=${sessionErrMsg}`, {
          route: typeof window !== "undefined" ? window.location.pathname : undefined,
        });
        setPhase("startup_error");
        return;
      }
      const session = sessionQuery.data;
      if (!session) return;
      const userId = session.user?.id ?? null;
      if (currentUserId.current !== userId) {
        onboardingInitialized.current = false;
        currentUserId.current = userId;
      }
      if (!onboardingInitialized.current) {
        const serverOnboarding = session.onboarding ?? getDefaultOnboardingState();
        const resume = loadOnboardingResume(userId);
        const resumeIsCurrentVersion =
          resume != null && resume.version >= (serverOnboarding.version ?? ONBOARDING_VERSION);
        const resumeStep = resumeIsCurrentVersion ? clampStep(resume.step) : null;
        const resumeCompleted = !!(resumeIsCurrentVersion && resume?.completed);
        const mergedCompleted = !!serverOnboarding.completed || resumeCompleted;
        const mergedStep = mergedCompleted
          ? ONBOARDING_MAX_STEP
          : (resumeStep ?? clampStep(serverOnboarding.step ?? 0));
        const mergedState: WebAppOnboardingState = {
          completed: mergedCompleted,
          step: mergedStep,
          version: serverOnboarding.version ?? ONBOARDING_VERSION,
          updated_at: serverOnboarding.updated_at ?? null,
        };
        if (resumeCompleted && !serverOnboarding.completed) {
          void webappApi.post<WebAppOnboardingStateResponse>("/webapp/onboarding/state", {
            step: ONBOARDING_MAX_STEP,
            completed: true,
            version: mergedState.version,
          });
        }
        onboardingInitialized.current = true;
        setOnboardingState(mergedState);
        if (mergedState.completed) {
          clearOnboardingResume(userId);
          setSplashDone(true);
          setPhase("app_ready");
        } else {
          saveOnboardingResume(userId, { step: mergedStep, version: mergedState.version });
          setPhase(splashDone ? "onboarding" : "splash_visible");
        }
        return;
      }
      if (onboardingState.completed) {
        setSplashDone(true);
        setPhase("app_ready");
      } else if (splashDone) {
        setPhase("onboarding");
      } else {
        setPhase("splash_visible");
      }
      return;
    }

    if (phase === "app_ready" && !hasToken) {
      setPhase("telegram_ready");
      return;
    }

    if (phase === "onboarding" && onboardingState.completed) {
      setPhase("app_ready");
    }
  }, [
    hasToken,
    initData,
    isInsideTelegram,
    onboardingState.completed,
    phase,
    sessionQuery.data,
    sessionQuery.error,
    sessionQuery.isLoading,
    splashDone,
  ]);

  const setOnboardingStep = useCallback(
    async (step: number) => {
      const clampedStep = clampStep(step);
      setOnboardingError(null);
      const userId = currentUserId.current;
      setOnboardingState((prev) => {
        const next = {
          ...prev,
          step: clampedStep,
        };
        saveOnboardingResume(userId, {
          step: next.step ?? 0,
          version: next.version || ONBOARDING_VERSION,
          completed: false,
        });
        return next;
      });
      const payload: WebAppOnboardingStateRequest = {
        step: clampedStep,
        version: onboardingState.version || ONBOARDING_VERSION,
      };
      try {
        const res = await webappApi.post<WebAppOnboardingStateResponse>(
          "/webapp/onboarding/state",
          payload,
        );
        setOnboardingState((prev) => ({
          ...res.onboarding,
          // Allow in-flow backward navigation even though server stores max seen step.
          step: res.onboarding.completed ? ONBOARDING_MAX_STEP : prev.step,
        }));
        if (!res.onboarding.completed) {
          saveOnboardingResume(userId, {
            step: clampedStep,
            version: res.onboarding.version,
            completed: false,
          });
        }
      } catch {
        // Keep optimistic local step for resume even when network is unstable.
      }
    },
    [onboardingState.version],
  );

  const completeOnboarding = useCallback(async () => {
    setOnboardingError(null);
    setIsCompletingOnboarding(true);
    const payload: WebAppOnboardingStateRequest = {
      step: ONBOARDING_MAX_STEP,
      completed: true,
      version: onboardingState.version || ONBOARDING_VERSION,
    };
    const doPost = () =>
      webappApi.post<WebAppOnboardingStateResponse>(
        "/webapp/onboarding/state",
        payload,
      );
    try {
      const res = await doPost();
      setOnboardingState(res.onboarding);
      clearOnboardingResume(currentUserId.current);
      setSplashDone(true);
      await queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      setPhase("app_ready");
      return { done: true, synced: true };
    } catch {
      // Retry once after short delay before fail-open.
      try {
        await new Promise((r) => setTimeout(r, 500));
        const res = await doPost();
        setOnboardingState(res.onboarding);
        clearOnboardingResume(currentUserId.current);
        setSplashDone(true);
        await queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
        setPhase("app_ready");
        return { done: true, synced: true };
      } catch {
        // Fail-open to avoid trapping users when backend is unavailable.
        saveOnboardingResume(currentUserId.current, {
          step: ONBOARDING_MAX_STEP,
          version: onboardingState.version || ONBOARDING_VERSION,
          completed: true,
        });
        setOnboardingState((prev) => ({
          ...prev,
          completed: true,
          step: ONBOARDING_MAX_STEP,
        }));
        setSplashDone(true);
        setPhase("app_ready");
        return { done: true, synced: false };
      }
    } finally {
      setIsCompletingOnboarding(false);
    }
  }, [onboardingState.version, queryClient]);

  useEffect(() => {
    const session = sessionQuery.data;
    const userId = session?.user?.id ?? null;
    if (currentUserId.current !== userId) {
      autoCompletedUserId.current = null;
    }
    if (phase !== "onboarding") return;
    if (!session || onboardingState.completed || isCompletingOnboarding) return;
    if (!shouldExitOnboarding(session)) return;
    if (autoCompletedUserId.current === userId) return;

    autoCompletedUserId.current = userId;
    void completeOnboarding();
  }, [
    completeOnboarding,
    isCompletingOnboarding,
    onboardingState.completed,
    phase,
    sessionQuery.data,
  ]);

  const state: BootstrapState =
    phase === "startup_error"
      ? {
          status: "startup_error",
          error:
            startupError ??
            ({
              title: "Session error",
              message: "Please try again.",
            } satisfies StartupError),
        }
      : { status: phase };

  return {
    state,
    phase,
    session: sessionQuery.data,
    slowNetwork,
    onboardingStep: clampStep(onboardingState.step ?? 0),
    onboardingCompleted: onboardingState.completed,
    onboardingVersion: onboardingState.version || ONBOARDING_VERSION,
    isCompletingOnboarding,
    onboardingError,
    startupError,
    retry,
    setOnboardingStep,
    completeOnboarding,
  };
}
