/**
 * Miniapp analytics bootstrap: PostHog, Faro, backend sink.
 * Call once at app startup.
 */

import type { WebappTelemetryPayloadBase } from "@vpn-suite/shared";
import {
  initPostHog,
  initFaro,
  setBackendSink,
  setContext,
  getAppName,
  track,
} from "@vpn-suite/shared";
import { sendWebappTelemetry } from "@/telemetry/webappTelemetry";
import { telegramClient } from "@/telegram/telegramCoreClient";

/** Map canonical miniapp.* event names to backend WebappTelemetryEventType. */
const EVENT_MAP: Record<string, string> = {
  "miniapp.opened": "app_open",
  "miniapp.ready": "", // lifecycle; PostHog only
  "miniapp.closed": "", // lifecycle; PostHog only
  "miniapp.page_view": "screen_view",
  "miniapp.cta_clicked": "cta_click",
  "miniapp.plan_selected": "plan_selected",
  "miniapp.checkout_started": "checkout_started",
  "miniapp.checkout_viewed": "checkout_viewed",
  "miniapp.invoice_created": "invoice_created",
  "miniapp.invoice_opened": "invoice_opened",
  "miniapp.payment_start": "payment_start",
  "miniapp.payment_succeeded": "payment_success",
  "miniapp.payment_failed": "payment_fail",
  "miniapp.config_downloaded": "config_download",
  "miniapp.device_revoked": "device_removal",
  "miniapp.web_vital": "web_vital",
  "miniapp.onboarding_started": "onboarding_started",
  "miniapp.onboarding_step_viewed": "onboarding_step_viewed",
  "miniapp.onboarding_step_completed": "onboarding_step_completed",
  "miniapp.connect_confirmed": "connect_confirmed",
  "miniapp.device_issue_started": "device_issue_started",
  "miniapp.device_issue_success": "device_issue_success",
  "miniapp.server_switched": "server_switched",
  "miniapp.cancel_flow_started": "cancel_flow_started",
  "miniapp.cancel_reason_selected": "cancel_reason_selected",
  "miniapp.retention_offer_shown": "retention_offer_shown",
  "miniapp.pause_selected": "pause_selected",
  "miniapp.profile_updated": "profile_updated",
  "miniapp.upsell_impression": "upsell_impression",
  "miniapp.upsell_clicked": "upsell_clicked",
  "miniapp.onboarding_abandoned": "onboarding_abandoned",
  "miniapp.error_shown": "", // skip backend; PostHog/Faro capture errors
};

function mapToBackendEvent(eventName: string): string | null {
  return EVENT_MAP[eventName] ?? (eventName.startsWith("miniapp.") ? null : eventName);
}

function extractBackendPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...payload };
  delete out.event_version;
  delete out.client_ts;
  delete out.trace_id;
  delete out.request_id;
  delete out.app_surface;
  delete out.app_name;
  delete out.environment;
  if (payload.screen_name != null) out.screen_name = payload.screen_name;
  if (payload.cta_name != null) out.cta_name = payload.cta_name;
  if (payload.plan_id != null) out.plan_id = payload.plan_id;
  if (payload.device_id != null) out.device_id = payload.device_id;
  if (payload.step != null) out.step = payload.step;
  if (payload.reason_group != null) out.reason_group = payload.reason_group;
  if (payload.name != null) out.name = payload.name;
  if (payload.value != null) out.value = payload.value;
  if (payload.unit != null) out.unit = payload.unit;
  if (payload.route != null) out.route = payload.route;
  if (payload.message != null) out.message = String(payload.message).slice(0, 500);
  return out;
}

export async function initAnalytics(): Promise<void> {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined;
  const faroUrl = import.meta.env.VITE_FARO_COLLECTOR_URL as string | undefined;
  const enabled = import.meta.env.VITE_ANALYTICS_ENABLED === "1" && import.meta.env.MODE !== "test";

  const platform = telegramClient.getPlatform();
  const startParam = telegramClient.getInitDataUnsafe()?.start_param ?? "";
  const colorScheme = telegramClient.getColorScheme();

  setBackendSink((eventName: string, payload: Record<string, unknown>) => {
    const backendEvent = mapToBackendEvent(eventName);
    if (!backendEvent || backendEvent === "") return;
    const backendPayload = extractBackendPayload(payload);
    void sendWebappTelemetry(backendEvent as import("@vpn-suite/shared").WebappTelemetryEventType, {
      ...backendPayload,
      telegram_platform: platform,
      color_scheme: colorScheme,
    } as WebappTelemetryPayloadBase);
  });

  setContext({
    app_surface: "miniapp",
    app_name: getAppName("miniapp"),
    environment: import.meta.env.MODE ?? "development",
    release: import.meta.env.VITE_BUILD_HASH ?? import.meta.env.MODE ?? "0.0.0",
    telegram_platform: platform,
    telegram_start_param: startParam ? "[present]" : "",
    locale: navigator.language ?? "",
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
      appName: getAppName("miniapp"),
      appVersion: import.meta.env.VITE_BUILD_HASH ?? "0.0.0",
      enabled: true,
    });
  }

  if (typeof document !== "undefined") {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") {
          track("miniapp.closed", {});
        }
      },
      { once: false },
    );
  }
}

/**
 * Enrich analytics context when bootstrap reaches app_ready.
 * Call once when phase === "app_ready" to update context with full platform/startParam
 * (init may have run before Telegram was ready).
 */
export function enrichContextAtAppReady(): void {
  const platform = telegramClient.getPlatform();
  const startParam = telegramClient.getInitDataUnsafe()?.start_param ?? "";
  const colorScheme = telegramClient.getColorScheme();
  setContext({
    telegram_platform: platform,
    telegram_start_param: startParam ? startParam.slice(0, 200) : "",
    telegram_color_scheme: colorScheme,
  });
}
