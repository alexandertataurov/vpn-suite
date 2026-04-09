/*
 * Minimal global error capture for the miniapp.
 * Single entry: reportError → backend + PostHog + Sentry.
 */

import { trackError } from "@vpn-suite/shared";
import { getApiBaseUrl } from "@/config/env";

type FrontendErrorPayload = {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  route?: string;
  buildHash?: string | null;
  userAgent?: string | null;
};

export type ReportErrorContext = {
  route?: string;
  componentStack?: string | null;
  [key: string]: unknown;
};

function safeString(value: unknown): string {
  if (value == null) return "";
  return String(value).slice(0, 500);
}

function getFrontendErrorUrl(): string {
  return `${getApiBaseUrl()}/log/frontend-error`;
}

async function postFrontendError(payload: FrontendErrorPayload): Promise<void> {
  try {
    // The backend protects `/api/v1/*` with a strict per-IP rate limiter.
    // Frontend error loops can otherwise spam this telemetry endpoint and trigger
    // 429s that degrade all API traffic for the same client IP.
    const now = Date.now();
    const throttleKey = `${payload.route ?? "unknown"}|${payload.message}`;
    const lastByKey = lastPostAtByKey.get(throttleKey);
    if (lastByKey != null && now - lastByKey < POST_KEY_COOLDOWN_MS) return;

    // Global (per tab) cap to avoid unbounded bursts when error messages vary.
    postTimestamps = postTimestamps.filter((t) => now - t < POST_WINDOW_MS);
    if (postTimestamps.length >= POST_CAP_PER_WINDOW) return;

    postTimestamps.push(now);
    lastPostAtByKey.set(throttleKey, now);
    if (lastPostAtByKey.size > POST_KEY_MAX) {
      // Keep memory bounded in long-running sessions.
      lastPostAtByKey.clear();
    }

    await fetch(getFrontendErrorUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

const POST_WINDOW_MS = 60_000;
const POST_CAP_PER_WINDOW = 10;
const POST_KEY_COOLDOWN_MS = 10_000;
const POST_KEY_MAX = 200;

let postTimestamps: number[] = [];
const lastPostAtByKey = new Map<string, number>();

/**
 * Single entry for error reporting. Normalizes, then forwards to backend, PostHog, and Sentry.
 * Call from wireGlobalErrors, AppErrorBoundary, or explicit catch blocks.
 */
export function reportError(error: Error | unknown, context?: ReportErrorContext): void {
  try {
    const err = error instanceof Error ? error : new Error(safeString(error));
    const message = error instanceof Error ? error.message : safeString(error);
    const stack = error instanceof Error ? error.stack ?? null : null;
    const route = context?.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
    const payload: FrontendErrorPayload = {
      message,
      stack,
      route,
      componentStack: context?.componentStack ?? null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
    void postFrontendError(payload);
    trackError(message, { stack: stack ?? undefined, route });
    void import("./sentry").then(({ captureException }) => {
      captureException(err, { ...context, route });
    });
  } catch {
    /* ignore */
  }
}

function onUnhandledRejection(ev: PromiseRejectionEvent): void {
  try {
    const reason = ev.reason;
    const err = reason instanceof Error ? reason : new Error(safeString(reason));
    reportError(err);
  } catch {
    /* ignore */
  }
}

function onWindowError(ev: ErrorEvent): void {
  try {
    const raw = ev.error;
    const err = raw instanceof Error ? raw : new Error(safeString(ev.message) || "window_error");
    reportError(err);
  } catch {
    /* ignore */
  }
}

let wired = false;

export function wireGlobalErrors(): void {
  if (typeof window === "undefined" || wired) return;
  wired = true;
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onWindowError);
}
