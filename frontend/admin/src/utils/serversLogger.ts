/**
 * Servers page events via telemetry SSOT. In dev with VITE_DEBUG_SERVERS=1 also logs to console.
 */

import { track } from "../telemetry";

const CONSOLE_ENABLED =
  typeof import.meta !== "undefined" &&
  (import.meta.env.DEV === true || import.meta.env.VITE_DEBUG_SERVERS === "1");

function debugLog(event: string, payload: Record<string, unknown>): void {
  if (!CONSOLE_ENABLED || typeof console === "undefined") return;
  console.debug("[servers]", JSON.stringify({ event, ...payload, ts: new Date().toISOString() }));
}

export const serversLogger = {
  serversListFetch(payload: {
    endpoint: string;
    status?: number;
    durationMs?: number;
    requestId?: string;
    error?: string;
  }): void {
    try {
      track("servers_list_fetch", {
        endpoint: payload.endpoint,
        status: payload.status,
        duration_ms: payload.durationMs,
        request_id: payload.requestId,
        error: payload.error,
      });
      debugLog("servers_list_fetch", payload);
    } catch {
      /* telemetry never throws */
    }
  },

  serversSync(payload: { serverId: string; success: boolean; requestId?: string }): void {
    try {
      track("servers_sync", {
        server_id: payload.serverId,
        success: payload.success,
        request_id: payload.requestId,
      });
      debugLog("servers_sync", payload);
    } catch {
      /* noop */
    }
  },

  serverDelete(payload: {
    serverId: string;
    success: boolean;
    statusCode?: number;
    requestId?: string;
  }): void {
    try {
      track("server_delete", {
        server_id: payload.serverId,
        success: payload.success,
        status_code: payload.statusCode,
        request_id: payload.requestId,
      });
      debugLog("server_delete", payload);
    } catch {
      /* noop */
    }
  },

  parsingError(payload: { endpoint: string; message: string }): void {
    try {
      track("parsing_error", { endpoint: payload.endpoint, message: payload.message });
      debugLog("parsing_error", payload);
    } catch {
      /* noop */
    }
  },

  staleDetected(payload: { serverId: string; field: string; ageMs: number }): void {
    try {
      track("stale_detected", {
        server_id: payload.serverId,
        field: payload.field,
        age_ms: payload.ageMs,
      });
      debugLog("stale_detected", payload);
    } catch {
      /* noop */
    }
  },
};
