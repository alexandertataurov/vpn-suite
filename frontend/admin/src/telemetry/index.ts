/**
 * Client telemetry SSOT — public API only.
 * All event emission goes through this module.
 */

import { type TelemetryEventName, type TelemetryPayloadMap, validatePayload } from "./schema";
import { setContext as setContextInternal, updateRoute } from "./context";
import { enqueue, initTransport, flush as transportFlush, getTransportStats } from "./client";

export type { TelemetryEventName, TelemetryPayloadMap };
export { getTransportStats };

export interface TelemetryConfig {
  baseUrl: () => string;
  getToken?: () => string | null;
  /** Send frontend_error events to backend POST /log/frontend-error. Default true. */
  sendFrontendErrors?: boolean;
  /** Send batched telemetry events to backend POST /log/events. Default true. */
  sendEventsBatch?: boolean;
  /** Sampling rate for non-critical events, range [0..1]. Default 1.0. */
  sampleRate?: number;
  /** Debug: console logging and enable debug panel. Default from VITE_TELEMETRY_DEBUG. */
  debug?: boolean;
}

let initialized = false;

export function init(config: TelemetryConfig): void {
  if (initialized) return;
  const env = typeof import.meta !== "undefined" ? (import.meta as { env?: { VITE_TELEMETRY_DEBUG?: string; VITE_BUILD_HASH?: string } }).env : undefined;
  const debug = config.debug ?? env?.VITE_TELEMETRY_DEBUG === "1";
  initTransport({
    baseUrl: config.baseUrl,
    getToken: config.getToken,
    sendFrontendErrors: config.sendFrontendErrors ?? true,
    sendEventsBatch: config.sendEventsBatch ?? true,
    sampleRate: Math.max(0, Math.min(1, config.sampleRate ?? 1)),
    debug,
  });
  setContextInternal({ build_hash: env?.VITE_BUILD_HASH ?? null });
  initialized = true;
}

export function setContext(partial: Partial<{ route: string; build_hash: string | null; user_agent: string | null }>): void {
  setContextInternal(partial);
}

export function track<N extends TelemetryEventName>(eventName: N, payload: TelemetryPayloadMap[N]): void {
  if (!initialized) return;
  try {
    const validated = validatePayload(eventName, payload as unknown);
    if (validated) enqueue(eventName, validated as unknown as Record<string, unknown>);
  } catch {
    /* never crash UI */
  }
}

export function pageView(route: string, extra?: { referrer?: string; tab_id?: string }): void {
  updateRoute(route);
  track("page_view", { route, referrer: extra?.referrer, tab_id: extra?.tab_id });
}

export function error(err: Error | { message: string; stack?: string | null }, extra?: { route?: string; component_stack?: string | null }): void {
  const message = err instanceof Error ? err.message : err.message;
  const stack = err instanceof Error ? err.stack ?? null : (extra && "stack" in err ? err.stack : null) ?? null;
  track("frontend_error", {
    message,
    route: extra?.route,
    component_stack: extra?.component_stack ?? null,
    stack,
  });
}

export function flush(): void {
  transportFlush();
}
