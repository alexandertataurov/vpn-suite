import { useCallback } from "react";
import type {
  MiniappEventName,
  WebappTelemetryEventType,
  WebappTelemetryPayloadFor,
} from "@vpn-suite/shared";
import { track as analyticsTrack } from "@vpn-suite/shared";

/** Map legacy event names to canonical miniapp.* names. */
const LEGACY_TO_CANONICAL: Partial<Record<WebappTelemetryEventType, MiniappEventName>> = {
  app_open: "miniapp.opened",
  screen_view: "miniapp.page_view",
  cta_click: "miniapp.cta_clicked",
  plan_selected: "miniapp.plan_selected",
  checkout_started: "miniapp.checkout_started",
  checkout_viewed: "miniapp.checkout_viewed",
  invoice_created: "miniapp.invoice_created",
  invoice_opened: "miniapp.invoice_opened",
  payment_start: "miniapp.payment_start",
  payment_success: "miniapp.payment_succeeded",
  payment_fail: "miniapp.payment_failed",
  config_download: "miniapp.config_downloaded",
  device_removal: "miniapp.device_revoked",
  onboarding_started: "miniapp.onboarding_started",
  onboarding_step_viewed: "miniapp.onboarding_step_viewed",
  onboarding_step_completed: "miniapp.onboarding_step_completed",
  connect_confirmed: "miniapp.connect_confirmed",
  device_issue_started: "miniapp.device_issue_started",
  device_issue_success: "miniapp.device_issue_success",
  server_switched: "miniapp.server_switched",
  cancel_flow_started: "miniapp.cancel_flow_started",
  cancel_reason_selected: "miniapp.cancel_reason_selected",
  retention_offer_shown: "miniapp.retention_offer_shown",
  pause_selected: "miniapp.pause_selected",
  profile_updated: "miniapp.profile_updated",
  upsell_impression: "miniapp.upsell_impression",
  upsell_clicked: "miniapp.upsell_clicked",
  upsell_dismissed: "miniapp.upsell_dismissed",
  upsell_suppressed: "miniapp.upsell_suppressed",
  upsell_evaluated: "miniapp.upsell_evaluated",
  onboarding_abandoned: "miniapp.onboarding_abandoned",
  web_vital: "miniapp.web_vital",
};

export function useTelemetry(userPlan?: string | null) {
  const track = useCallback(
    <E extends WebappTelemetryEventType>(
      eventType: E,
      payload?: WebappTelemetryPayloadFor<E>,
    ) => {
      const base = payload ?? {};
      const merged = {
        ...(base as Record<string, unknown>),
        user_plan: userPlan ?? undefined,
      };
      const canonical: MiniappEventName | string =
        LEGACY_TO_CANONICAL[eventType] ?? `miniapp.${eventType}`;
      analyticsTrack(canonical, merged);
    },
    [userPlan],
  );

  return { track };
}
