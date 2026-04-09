/** Unified analytics facade: PostHog + Faro + optional backend sink. */

import { EVENT_VERSION, APP_NAMES } from "./constants";
import { getPostHog, trackPostHog, identifyPostHog, resetPostHog } from "./posthog";
import { getFaroTraceContext } from "./faro";
import type {
  TrackPayload,
  TrackOptions,
  IdentifyOptions,
  AnalyticsEventName,
} from "./types";

export type { TrackPayload, TrackOptions, IdentifyOptions, AnalyticsEventName };

/** Context set at init; merged into every event. */
let globalContext: Record<string, string | undefined> = {};

/** Backend sink callback (e.g. POST /webapp/telemetry or /api/v1/log/events). */
type BackendSink = (eventName: string, payload: Record<string, unknown>) => void | Promise<void>;

let backendSink: BackendSink | null = null;

/** Set backend sink for events. Called by app bootstrap. */
export function setBackendSink(sink: BackendSink | null): void {
  backendSink = sink;
}

/** Set global context merged into every event. */
export function setContext(ctx: Record<string, string | undefined>): void {
  globalContext = { ...globalContext, ...ctx };
}

/** Reset context and PostHog (e.g. on logout). */
export function reset(): void {
  globalContext = {};
  resetPostHog();
}

/** Track event. Routes to PostHog, optional Faro, and backend sink. */
export function track(
  eventName: AnalyticsEventName | string,
  payload: TrackPayload = {},
  options: TrackOptions = {},
): void {
  const ctx = options.context ?? {};
  const faroCtx = getFaroTraceContext();
  const merged: Record<string, unknown> = {
    ...globalContext,
    ...payload,
    event_version: EVENT_VERSION,
    client_ts: new Date().toISOString(),
    trace_id: faroCtx.trace_id ?? ctx.trace_id,
    request_id: ctx.request_id ?? faroCtx.span_id,
  };

  if (!options.skipPostHog && getPostHog()) {
    trackPostHog(eventName, merged);
  }

  if (backendSink) {
    void Promise.resolve(backendSink(eventName, merged)).catch(() => {
      // Fire-and-forget; do not break UI
    });
  }
}

/** Identify user (PostHog). Call after auth validated. */
export function identify(opts: IdentifyOptions): void {
  identifyPostHog(opts.distinctId, opts.traits);
  setContext({ distinct_id: opts.distinctId });
}

/** Track error. Sends to PostHog and backend sink. Faro captures unhandled errors automatically. */
export function trackError(
  message: string,
  opts?: { error_code?: string; stack?: string; route?: string },
): void {
  const payload: TrackPayload = {
    message: (message ?? "").slice(0, 500),
    ...opts,
    ...getFaroTraceContext(),
  };
  const eventName =
    globalContext.app_surface === "admin" ? "admin.error_shown" : "miniapp.error_shown";
  track(eventName as AnalyticsEventName, payload);
}

/** Track timing. */
export function trackTiming(
  label: string,
  durationMs: number,
  meta?: Record<string, unknown>,
): void {
  const eventName =
    globalContext.app_surface === "admin" ? "admin.user_action" : "miniapp.cta_clicked";
  track(eventName as AnalyticsEventName, {
    ...meta,
    timing_label: label,
    duration_ms: durationMs,
  });
}

/** Get app name for given surface. */
export function getAppName(surface: "miniapp" | "admin"): string {
  return APP_NAMES[surface];
}
