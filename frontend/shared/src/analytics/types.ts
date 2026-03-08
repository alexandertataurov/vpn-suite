/** Analytics event types and payloads. */

import type {
  AnalyticsEventName,
  SharedEventProperties,
} from "../types/telemetry.types";

export type TrackPayload = Record<string, string | number | boolean | null | undefined>;

export interface TrackOptions {
  /** Override shared properties for this event */
  context?: Partial<SharedEventProperties>;
  /** Skip PostHog (e.g. for backend-only sink) */
  skipPostHog?: boolean;
  /** Skip Faro (e.g. for product-only events) */
  skipFaro?: boolean;
}

export interface AnalyticsContext extends Partial<SharedEventProperties> {
  trace_id?: string;
  request_id?: string;
}

export interface IdentifyOptions {
  distinctId: string;
  traits?: Record<string, unknown>;
}

export type { AnalyticsEventName, SharedEventProperties };
