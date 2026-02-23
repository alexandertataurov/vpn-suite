/**
 * Structured logging for servers page. Enabled in dev or when VITE_DEBUG_SERVERS=1.
 * Logs to console; can be extended to POST to /log/frontend-error or similar.
 */

const ENABLED =
  typeof import.meta !== "undefined" &&
  (import.meta.env.DEV === true || import.meta.env.VITE_DEBUG_SERVERS === "1");

function log(event: string, payload: Record<string, unknown>): void {
  if (!ENABLED || typeof console === "undefined") return;
  const entry = { event, ...payload, ts: new Date().toISOString() };
  console.debug("[servers]", JSON.stringify(entry));
}

export const serversLogger = {
  serversListFetch(payload: {
    endpoint: string;
    status?: number;
    durationMs?: number;
    requestId?: string;
    error?: string;
  }): void {
    log("servers_list_fetch", payload);
  },

  serversSync(payload: { serverId: string; success: boolean; requestId?: string }): void {
    log("servers_sync", payload);
  },

  serverDelete(payload: {
    serverId: string;
    success: boolean;
    statusCode?: number;
    requestId?: string;
  }): void {
    log("server_delete", payload);
  },

  parsingError(payload: { endpoint: string; message: string }): void {
    log("parsing_error", payload);
  },

  staleDetected(payload: { serverId: string; field: string; ageMs: number }): void {
    log("stale_detected", payload);
  },
};
