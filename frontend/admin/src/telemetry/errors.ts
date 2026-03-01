/**
 * Global error wiring: unhandledrejection. ErrorBoundary reports via index.error().
 */

import * as telemetry from "./index";

function onUnhandledRejection(ev: PromiseRejectionEvent): void {
  try {
    const reason = ev.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack ?? null : null;
    telemetry.error(
      { message, stack },
      { route: typeof window !== "undefined" ? window.location.pathname : undefined }
    );
  } catch {
    /* never throw */
  }
}

function onWindowError(ev: ErrorEvent): void {
  try {
    const err = ev.error;
    const message = err instanceof Error ? err.message : ev.message || "window_error";
    const stack = err instanceof Error ? err.stack ?? null : null;
    telemetry.error(
      { message, stack },
      { route: typeof window !== "undefined" ? window.location.pathname : undefined }
    );
  } catch {
    /* never throw */
  }
}

let wired = false;

export function wireGlobalErrors(): void {
  if (typeof window === "undefined" || wired) return;
  wired = true;
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onWindowError);
}
