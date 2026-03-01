/**
 * Telemetry transport: buffered + batched backend ingest with optional frontend_error fallback.
 * Never throws into UI. Tracks queue size and dropped count for debug panel.
 */

import type { TelemetryEventName } from "./schema";
import type { TelemetryContextSnapshot } from "./context";
import { getContext } from "./context";

const MAX_BUFFER = 500;
const RECENT_MAX = 50;
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5_000;
const SENSITIVE_KEY_MARKERS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "email",
  "phone",
  "ip",
  "private_key",
  "preshared",
] as const;

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
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export interface TransportConfig {
  baseUrl: () => string;
  getToken?: () => string | null;
  sendFrontendErrors: boolean;
  sendEventsBatch: boolean;
  sampleRate: number;
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

function isSensitiveKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return SENSITIVE_KEY_MARKERS.some((marker) => lowered.includes(marker));
}

function redactValue(input: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";
  if (Array.isArray(input)) return input.slice(0, 50).map((v) => redactValue(v, depth + 1));
  if (input && typeof input === "object") {
    const src = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      out[k] = isSensitiveKey(k) ? "[redacted]" : redactValue(v, depth + 1);
    }
    return out;
  }
  if (typeof input === "string") return input.slice(0, 500);
  return input;
}

function pushToRecent(env: Envelope): void {
  recent.push(env);
  if (recent.length > RECENT_MAX) recent.shift();
}

function shouldSample(event: TelemetryEventName): boolean {
  if (event === "frontend_error" || event === "login_failure") return true;
  const rate = config?.sampleRate ?? 1;
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() <= rate;
}

function scheduleFlush(): void {
  if (flushTimer || !config?.sendEventsBatch) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushBatch();
  }, FLUSH_INTERVAL_MS);
}

export function enqueue(event: TelemetryEventName, payload: Record<string, unknown>): void {
  if (!shouldSample(event)) {
    dropped += 1;
    return;
  }
  const safePayload = redactValue(payload) as Record<string, unknown>;
  const envelope: Envelope = {
    event,
    payload: safePayload,
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
      console.debug("[telemetry]", event, safePayload);
    } catch {
      /* noop */
    }
  }

  if (typeof window !== "undefined") {
    const w = window as unknown as { __telemetryEvents?: Envelope[] };
    if (Array.isArray(w.__telemetryEvents)) w.__telemetryEvents.push(envelope);
  }

  if (event === "frontend_error" && config?.sendFrontendErrors) {
    void sendFrontendErrorToBackend(envelope);
  }
  if (config?.sendEventsBatch) {
    if (buffer.length >= BATCH_SIZE) {
      void flushBatch();
    } else {
      scheduleFlush();
    }
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
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (!res.ok && c.debug && console?.warn) {
      console.warn("[telemetry] frontend-error POST failed", res.status);
    }
  } catch {
    /* fire-and-forget; never throw */
  }
}

async function flushBatch(): Promise<void> {
  const c = config;
  if (!c || !c.sendEventsBatch || buffer.length === 0) {
    lastFlushAt = new Date().toISOString();
    return;
  }

  const batch = buffer.splice(0, Math.min(BATCH_SIZE, buffer.length));
  if (batch.length === 0) {
    lastFlushAt = new Date().toISOString();
    return;
  }

  const base = c.baseUrl().replace(/\/$/, "");
  const token = c.getToken?.() ?? null;
  try {
    const res = await fetch(`${base}/log/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        schemaVersion: "1.0",
        sentAt: new Date().toISOString(),
        events: batch,
      }),
      keepalive: true,
    });
    if (!res.ok) {
      // Put failed batch back at the front to preserve order where possible.
      buffer.unshift(...batch);
      if (buffer.length > MAX_BUFFER) {
        const overflow = buffer.length - MAX_BUFFER;
        buffer.splice(MAX_BUFFER, overflow);
        dropped += overflow;
      }
      if (c.debug && console?.warn) {
        console.warn("[telemetry] events POST failed", res.status);
      }
    }
  } catch {
    buffer.unshift(...batch);
    if (buffer.length > MAX_BUFFER) {
      const overflow = buffer.length - MAX_BUFFER;
      buffer.splice(MAX_BUFFER, overflow);
      dropped += overflow;
    }
  } finally {
    lastFlushAt = new Date().toISOString();
    if (buffer.length > 0) scheduleFlush();
  }
}

export function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  void flushBatch();
}

/** Test only: clear buffer, recent, and dropped count. */
export function clearForTesting(): void {
  buffer.length = 0;
  recent.length = 0;
  dropped = 0;
  lastFlushAt = null;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
