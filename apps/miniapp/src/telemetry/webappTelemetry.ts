import { getWebappToken, webappApi } from "@/api/client";
import type {
  WebappTelemetryEventType,
  WebappTelemetryPayloadBase,
  WebappTelemetryPayloadFor,
} from "@vpn-suite/shared";

const BUILD_VERSION: string =
  typeof import.meta !== "undefined" && typeof import.meta.env?.MODE === "string"
    ? import.meta.env.MODE
    : "unknown";

type QueuedBody = {
  event_type: WebappTelemetryEventType;
  payload: Record<string, unknown>;
};

const queue: QueuedBody[] = [];

export async function sendWebappTelemetry<E extends WebappTelemetryEventType>(
  eventType: E,
  payload: WebappTelemetryPayloadFor<E> | WebappTelemetryPayloadBase = {},
): Promise<void> {
  const body: QueuedBody = {
    event_type: eventType,
    payload: {
      ...payload,
      build_version: BUILD_VERSION,
    },
  };

  if (!getWebappToken()) {
    queue.push(body);
    return;
  }

  try {
    await webappApi.post("/webapp/telemetry", body);
  } catch {
    // Fire-and-forget; avoid breaking UI on telemetry issues.
  }
}

/** Send any events queued before token was available. Call when token becomes set. */
export function flushTelemetryQueue(): void {
  const items = queue.splice(0, queue.length);
  for (const body of items) {
    void webappApi.post("/webapp/telemetry", body).catch(() => {
      // Fire-and-forget; do not re-queue to avoid loops.
    });
  }
}
