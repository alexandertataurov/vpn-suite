// Why: these primitives are infrastructure-level and should not be admin-only internals.
export type LiveConnectionState = "offline" | "connecting" | "connected" | "degraded" | "error";

export interface LiveClusterState {
  nodes: LiveNodeState[];
  updatedAt: number;
}

export interface LiveNodeState {
  nodeId: string;
  status: string;
  peerCount: number | null;
  rxBytes: number | null;
  txBytes: number | null;
  heartbeatAgeSeconds: number | null;
  stale: boolean;
}

export type WebappTelemetryEventType =
  | "screen_view"
  | "app_open"
  | "cta_click"
  | "config_download"
  | "device_removal"
  | "plan_selected"
  | "checkout_started"
  | "checkout_viewed"
  | "invoice_created"
  | "invoice_opened"
  | "payment_start"
  | "payment_success"
  | "payment_fail"
  | "onboarding_started"
  | "onboarding_step_viewed"
  | "onboarding_step_completed"
  | "onboarding_abandoned"
  | "connect_confirmed"
  | "device_issue_started"
  | "device_issue_success"
  | "device_revoked"
  | "server_switched"
  | "cancel_flow_started"
  | "cancel_reason_selected"
  | "retention_offer_shown"
  | "pause_selected"
  | "profile_updated"
  | "upsell_impression"
  | "upsell_clicked"
  | "upsell_dismissed"
  | "upsell_suppressed"
  | "upsell_evaluated"
  | "web_vital";

export interface WebappTelemetryPayloadBase {
  screen_name?: string;
  cta_name?: string;
  plan_id?: string;
  user_plan?: string;
  latency_ms?: number;
  /** Request/correlation ID from API error for support traceability */
  correlation_id?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface WebVitalTelemetryPayload extends WebappTelemetryPayloadBase {
  name: string;
  value: number;
  unit: "ms" | "score";
  route?: string;
}

export interface WebappTelemetryEventMap {
  app_open: WebappTelemetryPayloadBase;
  screen_view: WebappTelemetryPayloadBase & { screen_name: string };
  cta_click: WebappTelemetryPayloadBase & { cta_name: string; screen_name?: string; plan_id?: string };
  config_download: WebappTelemetryPayloadBase & { screen_name?: string };
  device_removal: WebappTelemetryPayloadBase & { screen_name?: string };
  plan_selected: WebappTelemetryPayloadBase & { plan_id: string };
  checkout_started: WebappTelemetryPayloadBase & { plan_id?: string };
  checkout_viewed: WebappTelemetryPayloadBase & { plan_id?: string };
  invoice_created: WebappTelemetryPayloadBase & { plan_id?: string };
  invoice_opened: WebappTelemetryPayloadBase & { plan_id?: string };
  payment_start: WebappTelemetryPayloadBase & { plan_id?: string };
  payment_success: WebappTelemetryPayloadBase & { plan_id?: string };
  payment_fail: WebappTelemetryPayloadBase & { plan_id?: string; reason?: string };
  onboarding_started: WebappTelemetryPayloadBase;
  onboarding_step_viewed: WebappTelemetryPayloadBase & { step?: number };
  onboarding_step_completed: WebappTelemetryPayloadBase & { step?: number };
  onboarding_abandoned: WebappTelemetryPayloadBase & { step?: number };
  connect_confirmed: WebappTelemetryPayloadBase & { device_id?: string };
  device_issue_started: WebappTelemetryPayloadBase & { screen_name?: string };
  device_issue_success: WebappTelemetryPayloadBase & { screen_name?: string };
  device_revoked: WebappTelemetryPayloadBase & { screen_name?: string };
  server_switched: WebappTelemetryPayloadBase & { screen_name?: string };
  cancel_flow_started: WebappTelemetryPayloadBase & { screen_name?: string };
  cancel_reason_selected: WebappTelemetryPayloadBase & { reason_group?: string };
  retention_offer_shown: WebappTelemetryPayloadBase & { discount_percent?: number };
  pause_selected: WebappTelemetryPayloadBase & { screen_name?: string };
  profile_updated: WebappTelemetryPayloadBase & { screen_name?: string };
  upsell_impression: WebappTelemetryPayloadBase & { trigger: string; screen_name?: string };
  upsell_clicked: WebappTelemetryPayloadBase & { trigger: string; screen_name?: string };
  upsell_dismissed: WebappTelemetryPayloadBase & { trigger: string; screen_name?: string };
  upsell_suppressed: WebappTelemetryPayloadBase & {
    trigger: string;
    screen_name?: string;
    suppression_reason?: string;
  };
  upsell_evaluated: WebappTelemetryPayloadBase & {
    trigger: string;
    screen_name?: string;
    reason?: string;
    show?: boolean;
  };
  web_vital: WebVitalTelemetryPayload;
}

export type WebappTelemetryPayloadFor<E extends WebappTelemetryEventType> =
  WebappTelemetryEventMap[E];

// Canonical event namespaces for analytics (docs/analytics/event-taxonomy.md)
export type MiniappEventName =
  | "miniapp.opened"
  | "miniapp.ready"
  | "miniapp.closed"
  | "miniapp.auth.started"
  | "miniapp.auth.succeeded"
  | "miniapp.auth.failed"
  | "miniapp.page_view"
  | "miniapp.cta_clicked"
  | "miniapp.plan_viewed"
  | "miniapp.plan_selected"
  | "miniapp.checkout_started"
  | "miniapp.checkout_viewed"
  | "miniapp.invoice_created"
  | "miniapp.invoice_opened"
  | "miniapp.payment_start"
  | "miniapp.payment_succeeded"
  | "miniapp.payment_failed"
  | "miniapp.referral_attached"
  | "miniapp.server_selected"
  | "miniapp.config_downloaded"
  | "miniapp.vpn_connected_hint_viewed"
  | "miniapp.error_shown"
  | "miniapp.onboarding_started"
  | "miniapp.onboarding_step_viewed"
  | "miniapp.onboarding_step_completed"
  | "miniapp.onboarding_abandoned"
  | "miniapp.connect_confirmed"
  | "miniapp.device_issue_started"
  | "miniapp.device_issue_success"
  | "miniapp.device_revoked"
  | "miniapp.server_switched"
  | "miniapp.cancel_flow_started"
  | "miniapp.cancel_reason_selected"
  | "miniapp.retention_offer_shown"
  | "miniapp.pause_selected"
  | "miniapp.profile_updated"
  | "miniapp.upsell_impression"
  | "miniapp.upsell_clicked"
  | "miniapp.upsell_dismissed"
  | "miniapp.upsell_suppressed"
  | "miniapp.upsell_evaluated"
  | "miniapp.web_vital";

export type AdminEventName =
  | "admin.login_succeeded"
  | "admin.login_failed"
  | "admin.dashboard_viewed"
  | "admin.user_viewed"
  | "admin.node_viewed"
  | "admin.node_created"
  | "admin.node_updated"
  | "admin.node_disabled"
  | "admin.subscription_updated"
  | "admin.broadcast_sent"
  | "admin.filter_applied"
  | "admin.export_triggered"
  | "admin.error_shown"
  | "admin.page_view"
  | "admin.user_action"
  | "admin.web_vital";

export type AnalyticsEventName = MiniappEventName | AdminEventName;

export interface SharedEventProperties {
  event_version?: string;
  app_name?: string;
  app_surface?: "miniapp" | "admin" | "bot" | "api" | "worker";
  environment?: string;
  release?: string;
  session_id?: string;
  distinct_id?: string;
  anonymous_id?: string;
  request_id?: string;
  trace_id?: string;
  telegram_platform?: string;
  telegram_start_param?: string;
  locale?: string;
  page?: string;
  screen?: string;
  user_role?: string;
  client_ts?: string;
  server_ts?: string;
}

