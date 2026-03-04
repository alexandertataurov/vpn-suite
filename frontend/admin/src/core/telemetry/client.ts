import type { LiveClusterState } from "./types";

export interface TelemetryStreamHandlers {
  onEvent: (event: unknown) => void;
  onConnectionStateChange: (state: "offline" | "connecting" | "connected" | "degraded" | "error") => void;
}

/** Stub: real implementation will connect to SSE/WebSocket. Phase 4 wires this. */
export function startTelemetryStream(handlers: TelemetryStreamHandlers): () => void {
  void handlers;
  return () => {};
}

export function applyTelemetryEvent(prev: LiveClusterState | null, event: unknown): LiveClusterState | null {
  void event;
  return prev;
}
