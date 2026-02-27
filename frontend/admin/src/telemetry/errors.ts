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

let wired = false;

export function wireGlobalErrors(): void {
  if (typeof window === "undefined" || wired) return;
  wired = true;
  window.addEventListener("unhandledrejection", onUnhandledRejection);
}
