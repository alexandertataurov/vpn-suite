export { EVENT_VERSION, APP_NAMES } from "./constants";
export type { AppSurface } from "./constants";

export { initPostHog, getPostHog } from "./posthog";
export type { PostHogConfig } from "./posthog";

export { initFaro, getFaroTraceContext, isFaroInitialized } from "./faro";
export type { FaroConfig } from "./faro";

export {
  track,
  identify,
  reset,
  setContext,
  setBackendSink,
  trackError,
  trackTiming,
  getAppName,
} from "./client";
export type { TrackPayload, TrackOptions, IdentifyOptions } from "./types";
