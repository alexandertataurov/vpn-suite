/*
 * Minimal global error capture for the miniapp.
 * Sends to backend .../log/frontend-error (unauthenticated). Uses getBaseUrl() for cross-origin.
 * Also tracks via analytics.trackError for PostHog.
 */

import { trackError } from "@vpn-suite/shared";
import { getBaseUrl } from "@/lib/api-client";

type FrontendErrorPayload = {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  route?: string;
  buildHash?: string | null;
  userAgent?: string | null;
};

function safeString(value: unknown): string {
  if (value == null) return "";
  return String(value).slice(0, 500);
}

function getFrontendErrorUrl(): string {
  const base = getBaseUrl().replace(/\/$/, "");
  return `${base}/log/frontend-error`;
}

async function postFrontendError(payload: FrontendErrorPayload): Promise<void> {
  try {
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

function onUnhandledRejection(ev: PromiseRejectionEvent): void {
  try {
    const reason = ev.reason;
    const message = reason instanceof Error ? reason.message : safeString(reason);
    const stack = reason instanceof Error ? reason.stack ?? null : null;
    const route = typeof window !== "undefined" ? window.location.pathname : undefined;
    void postFrontendError({
      message,
      stack,
      route,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    trackError(message, { stack: stack ?? undefined, route });
  } catch {
    /* ignore */
  }
}

function onWindowError(ev: ErrorEvent): void {
  try {
    const err = ev.error;
    const message = err instanceof Error ? err.message : safeString(ev.message) || "window_error";
    const stack = err instanceof Error ? err.stack ?? null : null;
    const route = typeof window !== "undefined" ? window.location.pathname : undefined;
    void postFrontendError({
      message,
      stack,
      route,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    trackError(message, { stack: stack ?? undefined, route });
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
