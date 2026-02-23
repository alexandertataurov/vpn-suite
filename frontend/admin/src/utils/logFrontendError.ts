import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { useAuthStore } from "../store/authStore";

export interface LogFrontendErrorOpts {
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  route?: string;
  widgetId?: string;
  statusCode?: number;
  buildHash?: string | null;
  userAgent?: string | null;
}

/**
 * POST to /log/frontend-error. Fire-and-forget; never throws.
 * Message is built as [route][widgetId] message (statusCode) for filterable logs.
 */
export function logFrontendError(opts: LogFrontendErrorOpts): void {
  if (typeof window === "undefined") return;
  const parts: string[] = [];
  if (opts.route) parts.push(opts.route);
  if (opts.widgetId) parts.push(opts.widgetId);
  const prefix = parts.length ? `[${parts.join("][")}] ` : "";
  let message = prefix + opts.message;
  if (opts.statusCode != null) message += ` (${opts.statusCode})`;
  const payload = {
    message,
    stack: opts.stack ?? null,
    componentStack: opts.componentStack ?? null,
    route: opts.route ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    buildHash: opts.buildHash ?? (typeof import.meta !== "undefined" ? (import.meta as { env?: { VITE_BUILD_HASH?: string } }).env?.VITE_BUILD_HASH ?? null : null),
    userAgent: opts.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : null),
  };
  const token = useAuthStore.getState().getAccessToken();
  fetch(`${getBaseUrl()}/log/frontend-error`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
