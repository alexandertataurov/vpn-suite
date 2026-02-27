/**
 * Transport: in-memory buffer, optional POST of frontend_error to backend.
 * Never throws into UI. Tracks queue size and dropped count for debug panel.
 */

import type { TelemetryEventName } from "./schema";
import type { TelemetryContextSnapshot } from "./context";
import { getContext } from "./context";

const MAX_BUFFER = 500;
const RECENT_MAX = 50;

export interface Envelope {
  event: TelemetryEventName;
  payload: Record<string, unknown>;
  context: TelemetryContextSnapshot;
  ts: string;
}

const buffer: Envelope[] = [];
const recent: Envelope[] = [];
let dropped = 0;
let lastFlushAt: string | null = null;

export interface TransportConfig {
  baseUrl: () => string;
  getToken?: () => string | null;
  sendFrontendErrors: boolean;
  debug: boolean;
}

let config: TransportConfig | null = null;

export function initTransport(c: TransportConfig): void {
  config = c;
}

function getRecentList(): Envelope[] {
  return recent.slice();
}

function getBufferSize(): number {
  return buffer.length;
}

function getDroppedCount(): number {
  return dropped;
}

function getLastFlushAt(): string | null {
  return lastFlushAt;
}

export function getTransportStats(): {
  bufferSize: number;
  dropped: number;
  lastFlushAt: string | null;
  recent: Envelope[];
} {
  return {
    bufferSize: getBufferSize(),
    dropped: getDroppedCount(),
    lastFlushAt: getLastFlushAt(),
    recent: getRecentList(),
  };
}

function pushToRecent(env: Envelope): void {
  recent.push(env);
  if (recent.length > RECENT_MAX) recent.shift();
}

export function enqueue(event: TelemetryEventName, payload: Record<string, unknown>): void {
  const envelope: Envelope = {
    event,
    payload,
    context: getContext(),
    ts: new Date().toISOString(),
  };
  pushToRecent(envelope);
  if (buffer.length >= MAX_BUFFER) {
    dropped += 1;
    return;
  }
  buffer.push(envelope);

  if (config?.debug && typeof console !== "undefined") {
    try {
      console.debug("[telemetry]", event, payload);
    } catch {
      /* noop */
    }
  }

  if (typeof window !== "undefined") {
    const w = window as unknown as { __telemetryEvents?: Envelope[] };
    if (Array.isArray(w.__telemetryEvents)) w.__telemetryEvents.push(envelope);
  }

  if (event === "frontend_error" && config?.sendFrontendErrors) {
    sendFrontendErrorToBackend(envelope).catch(() => {});
  }
}

async function sendFrontendErrorToBackend(env: Envelope): Promise<void> {
  const c = config;
  if (!c) return;
  const base = c.baseUrl().replace(/\/$/, "");
  const token = c.getToken?.() ?? null;
  const body = {
    message: env.payload.message ?? "",
    stack: env.payload.stack ?? null,
    componentStack: env.payload.component_stack ?? null,
    route: env.context.route ?? env.payload.route ?? undefined,
    buildHash: env.context.build_hash ?? null,
    userAgent: env.context.user_agent ?? null,
  };
  try {
    const res = await fetch(`${base}/log/frontend-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!res.ok) {
      if (c.debug && console?.warn) console.warn("[telemetry] frontend-error POST failed", res.status);
    }
  } catch {
    /* fire-and-forget; never throw */
  }
}

export function flush(): void {
  lastFlushAt = new Date().toISOString();
  buffer.length = 0;
}

/** Test only: clear buffer, recent, and dropped count. */
export function clearForTesting(): void {
  buffer.length = 0;
  recent.length = 0;
  dropped = 0;
  lastFlushAt = null;
}
