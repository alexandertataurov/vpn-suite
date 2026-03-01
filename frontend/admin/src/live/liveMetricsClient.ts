import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { useAuthStore } from "../store/authStore";
import type { LiveClusterState, LiveConnectionState, LiveEvent } from "./liveMetricsStore";

const BACKOFF_INITIAL_MS = 2000;
const BACKOFF_MAX_MS = 60_000;

export interface LiveMetricsStreamHandlers {
  onEvent: (event: LiveEvent) => void;
  onConnectionStateChange?: (state: LiveConnectionState) => void;
}

let abortController: AbortController | null = null;
let running = false;

export function stopLiveMetricsStream(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  running = false;
}

export function startLiveMetricsStream(handlers: LiveMetricsStreamHandlers): void {
  if (running) return;
  running = true;

  let backoffMs = BACKOFF_INITIAL_MS;
  let failureCount = 0;

  const reportState = (state: LiveConnectionState) => {
    handlers.onConnectionStateChange?.(state);
  };

  const run = async (): Promise<void> => {
    const token = useAuthStore.getState().getAccessToken();
    if (!token) {
      reportState("offline");
      running = false;
      return;
    }

    const base = getBaseUrl().replace(/\/$/, "");
    const url = `${base}/live/metrics?min_interval_ms=1000`;
    abortController = new AbortController();
    const controller = abortController;
    let buffer = "";
    let eventType = "";

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        failureCount += 1;
        reportState(failureCount >= 3 ? "degraded" : "offline");
        if (failureCount < 3 && running) {
          const delay = Math.min(backoffMs, BACKOFF_MAX_MS);
          backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
          setTimeout(() => {
            if (running) void run();
          }, delay);
        } else {
          running = false;
        }
        return;
      }

      failureCount = 0;
      backoffMs = BACKOFF_INITIAL_MS;
      reportState("live");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i];
          if (line === undefined) continue;
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            const raw = line.slice(6);
            try {
              const data = JSON.parse(raw) as LiveClusterState | Record<string, unknown>;
              if (eventType === "snapshot" || eventType === "patch") {
                handlers.onEvent({ type: eventType, payload: data });
              } else if (eventType === "degraded") {
                handlers.onEvent({ type: "degraded", payload: data });
              }
            } catch {
              // ignore parse errors
            }
            eventType = "";
          }
        }
      }
      // Normal end-of-stream: treat as offline and attempt reconnect.
      if (running) {
        reportState("offline");
        failureCount += 1;
        const delay = Math.min(backoffMs, BACKOFF_MAX_MS);
        backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
        setTimeout(() => {
          if (running) void run();
        }, delay);
      } else {
        reportState("offline");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        reportState("offline");
        return;
      }
      failureCount += 1;
      reportState(failureCount >= 3 ? "degraded" : "offline");
      if (failureCount < 3 && running) {
        const delay = Math.min(backoffMs, BACKOFF_MAX_MS);
        backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
        setTimeout(() => {
          if (running) void run();
        }, delay);
      } else {
        running = false;
      }
    }
  };

  void run();
}
