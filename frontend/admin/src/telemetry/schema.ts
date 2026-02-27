/**
 * Client telemetry event catalog. All payloads use snake_case.
 * No PII: no tokens, emails, IPs, or wallet addresses.
 */

export const TELEMETRY_EVENT_NAMES = [
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
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

export interface PageViewPayload {
  route: string;
  referrer?: string;
  tab_id?: string;
}

export interface ApiRequestPayload {
  path: string;
  method: string;
  status: number;
  duration_ms: number;
  correlation_id?: string;
  retry_count?: number;
}

export interface ApiErrorPayload {
  path: string;
  method: string;
  code: number | string;
  correlation_id?: string;
}

export interface FrontendErrorPayload {
  message: string;
  route?: string;
  component_stack?: string | null;
  stack?: string | null;
}

export interface UserActionPayload {
  action_type: string;
  target_page?: string;
  extra?: Record<string, unknown>;
}

export interface ServersListFetchPayload {
  endpoint: string;
  status?: number;
  duration_ms?: number;
  request_id?: string;
  error?: string;
}

export interface ServersSyncPayload {
  server_id: string;
  success: boolean;
  request_id?: string;
}

export interface ServerDeletePayload {
  server_id: string;
  success: boolean;
  status_code?: number;
  request_id?: string;
}

export interface ParsingErrorPayload {
  endpoint: string;
  message: string;
}

export interface StaleDetectedPayload {
  server_id: string;
  field: string;
  age_ms: number;
}

export type TelemetryPayloadMap = {
  page_view: PageViewPayload;
  api_request: ApiRequestPayload;
  api_error: ApiErrorPayload;
  frontend_error: FrontendErrorPayload;
  user_action: UserActionPayload;
  servers_list_fetch: ServersListFetchPayload;
  servers_sync: ServersSyncPayload;
  server_delete: ServerDeletePayload;
  parsing_error: ParsingErrorPayload;
  stale_detected: StaleDetectedPayload;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function safeString(x: unknown): string {
  if (x == null) return "";
  return String(x);
}

/** Minimal runtime validation: ensure required fields exist and strip unknown. Does not add defaults. */
export function validatePayload<N extends TelemetryEventName>(
  eventName: N,
  payload: unknown
): TelemetryPayloadMap[N] | null {
  if (!payload || !isRecord(payload)) return null;
  const raw = payload as Record<string, unknown>;

  switch (eventName) {
    case "page_view":
      if (typeof raw.route !== "string") return null;
      return {
        route: raw.route,
        referrer: raw.referrer != null ? safeString(raw.referrer) : undefined,
        tab_id: raw.tab_id != null ? safeString(raw.tab_id) : undefined,
      } as TelemetryPayloadMap[N];

    case "api_request":
      if (typeof raw.path !== "string" || typeof raw.method !== "string") return null;
      return {
        path: raw.path,
        method: raw.method,
        status: Number(raw.status) || 0,
        duration_ms: Number(raw.duration_ms) || 0,
        correlation_id: raw.correlation_id != null ? safeString(raw.correlation_id) : undefined,
        retry_count: raw.retry_count != null ? Number(raw.retry_count) : undefined,
      } as TelemetryPayloadMap[N];

    case "api_error":
      if (typeof raw.path !== "string" || typeof raw.method !== "string") return null;
      return {
        path: raw.path,
        method: raw.method,
        code: typeof raw.code === "number" ? raw.code : safeString(raw.code),
        correlation_id: raw.correlation_id != null ? safeString(raw.correlation_id) : undefined,
      } as TelemetryPayloadMap[N];

    case "frontend_error":
      if (typeof raw.message !== "string") return null;
      return {
        message: raw.message,
        route: raw.route != null ? safeString(raw.route) : undefined,
        component_stack: raw.component_stack != null ? safeString(raw.component_stack) : null,
        stack: raw.stack != null ? safeString(raw.stack) : null,
      } as TelemetryPayloadMap[N];

    case "user_action":
      if (typeof raw.action_type !== "string") return null;
      return {
        action_type: raw.action_type,
        target_page: raw.target_page != null ? safeString(raw.target_page) : undefined,
        extra: isRecord(raw.extra) ? raw.extra : undefined,
      } as TelemetryPayloadMap[N];

    case "servers_list_fetch":
      if (typeof raw.endpoint !== "string") return null;
      return {
        endpoint: raw.endpoint,
        status: raw.status != null ? Number(raw.status) : undefined,
        duration_ms: raw.duration_ms != null ? Number(raw.duration_ms) : undefined,
        request_id: raw.request_id != null ? safeString(raw.request_id) : undefined,
        error: raw.error != null ? safeString(raw.error) : undefined,
      } as TelemetryPayloadMap[N];

    case "servers_sync":
      if (typeof raw.server_id !== "string" || typeof raw.success !== "boolean") return null;
      return {
        server_id: raw.server_id,
        success: raw.success,
        request_id: raw.request_id != null ? safeString(raw.request_id) : undefined,
      } as TelemetryPayloadMap[N];

    case "server_delete":
      if (typeof raw.server_id !== "string" || typeof raw.success !== "boolean") return null;
      return {
        server_id: raw.server_id,
        success: raw.success,
        status_code: raw.status_code != null ? Number(raw.status_code) : undefined,
        request_id: raw.request_id != null ? safeString(raw.request_id) : undefined,
      } as TelemetryPayloadMap[N];

    case "parsing_error":
      if (typeof raw.endpoint !== "string" || typeof raw.message !== "string") return null;
      return { endpoint: raw.endpoint, message: raw.message } as TelemetryPayloadMap[N];

    case "stale_detected": {
      if (typeof raw.server_id !== "string" || typeof raw.field !== "string") return null;
      const ageMs = Number(raw.age_ms);
      if (Number.isNaN(ageMs)) return null;
      return {
        server_id: raw.server_id,
        field: raw.field,
        age_ms: ageMs,
      } as TelemetryPayloadMap[N];
    }

    default:
      return null;
  }
}

export function isTelemetryEventName(name: string): name is TelemetryEventName {
  return (TELEMETRY_EVENT_NAMES as readonly string[]).includes(name);
}
