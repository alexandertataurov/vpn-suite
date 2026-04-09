/**
 * Admin analytics bootstrap: PostHog, Faro, backend sink (/api/v1/log/events).
 * Call once at app startup.
 */

import {
  initPostHog,
  initFaro,
  setBackendSink,
  setContext,
  getAppName,
} from "@vpn-suite/shared";
import type { ApiClient } from "../api/types";

/** Map canonical admin.* event names to backend FrontendTelemetryEventName. */
const EVENT_MAP: Record<string, string> = {
  "admin.login_succeeded": "login_success",
  "admin.login_failed": "login_failure",
  "admin.dashboard_viewed": "page_view",
  "admin.page_view": "page_view",
  "admin.user_action": "user_action",
  "admin.web_vital": "web_vital",
  "admin.error_shown": "frontend_error",
};

const VALID_BACKEND_EVENTS = new Set([
  "page_view",
  "api_request",
  "api_error",
  "frontend_error",
  "user_action",
  "servers_list_fetch",
  "servers_sync",
  "server_delete",
  "parsing_error",
  "stale_detected",
  "login_success",
  "login_failure",
  "navigation",
  "filter_change",
  "sort_change",
  "sync_action",
  "reissue_action",
  "incident_action",
  "web_vital",
]);

const eventQueue: Array<{ event: string; payload: Record<string, unknown> }> = [];
const FLUSH_MS = 5000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function mapToBackendEvent(eventName: string): string | null {
  const mapped = EVENT_MAP[eventName];
  if (mapped) return mapped;
  if (eventName.startsWith("admin.")) {
    const base = eventName.replace("admin.", "").replace(/\./g, "_");
    return VALID_BACKEND_EVENTS.has(base) ? base : null;
  }
  return VALID_BACKEND_EVENTS.has(eventName) ? eventName : null;
}

function extractBackendPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  delete out.event_version;
  delete out.client_ts;
  delete out.trace_id;
  delete out.request_id;
  delete out.app_surface;
  delete out.app_name;
  delete out.environment;
  return out;
}

export async function initAnalytics(apiClient: ApiClient): Promise<void> {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined;
  const faroUrl = import.meta.env.VITE_FARO_COLLECTOR_URL as string | undefined;
  const enabled = import.meta.env.VITE_ANALYTICS_ENABLED !== "0" && import.meta.env.MODE !== "test";

  setContext({
    app_surface: "admin",
    app_name: getAppName("admin"),
    environment: import.meta.env.MODE ?? "development",
    release: import.meta.env.VITE_BUILD_HASH ?? import.meta.env.MODE ?? "0.0.0",
    locale: navigator.language ?? "",
  });

  const flush = () => {
    if (eventQueue.length === 0) return;
    const batch = eventQueue.splice(0, 100);
    const body = {
      schemaVersion: "1.0",
      events: batch.map(({ event, payload }) => ({
        event,
        payload: extractBackendPayload(payload),
        context: { route: payload.page ?? payload.route ?? window.location.pathname },
        ts: new Date().toISOString(),
      })),
    };
    void apiClient.post("/api/v1/log/events", body).catch(() => {});
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
  };

  setBackendSink((eventName: string, payload: Record<string, unknown>) => {
    const backendEvent = mapToBackendEvent(eventName);
    if (!backendEvent) return;
    eventQueue.push({ event: backendEvent, payload });
    if (!flushTimer) {
      flushTimer = setTimeout(flush, FLUSH_MS);
    }
    if (eventQueue.length >= 50) {
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = null;
      flush();
    }
  });

  if (enabled && posthogKey) {
    await initPostHog({
      apiKey: posthogKey,
      apiHost: posthogHost ?? "https://us.i.posthog.com",
      enabled: true,
      capturePageview: false,
    });
  }

  if (enabled && faroUrl) {
    await initFaro({
      collectorUrl: faroUrl,
      appName: getAppName("admin"),
      appVersion: import.meta.env.VITE_BUILD_HASH ?? "0.0.0",
      enabled: true,
    });
  }

  window.addEventListener("pagehide", flush);
}
