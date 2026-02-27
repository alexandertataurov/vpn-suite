import { useEffect, useState } from "react";
import { getTransportStats } from "../telemetry";

const POLL_MS = 1500;

const isTelemetryDebugEnabled =
  typeof import.meta !== "undefined" &&
  (import.meta as { env?: { DEV?: boolean; VITE_TELEMETRY_DEBUG?: string } }).env?.DEV === true &&
  (import.meta as { env?: { VITE_TELEMETRY_DEBUG?: string } }).env?.VITE_TELEMETRY_DEBUG === "1";

export function TelemetryDebugPanel() {
  const [stats, setStats] = useState<ReturnType<typeof getTransportStats> | null>(null);
  useEffect(() => {
    if (!isTelemetryDebugEnabled) return;
    const tick = () => setStats(getTransportStats());
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (!isTelemetryDebugEnabled || !stats) return null;
  return (
    <div
      className="telemetry-debug-panel"
      role="region"
      aria-label="Telemetry debug panel"
      data-testid="telemetry-debug-panel"
    >
      <div className="telemetry-debug-header">Telemetry (dev)</div>
      <div className="telemetry-debug-stats">
        <span>Queue: {stats.bufferSize}</span>
        <span>Dropped: {stats.dropped}</span>
        <span>Last flush: {stats.lastFlushAt ?? "—"}</span>
      </div>
      <div className="telemetry-debug-context">
        <strong>Context</strong> {JSON.stringify(stats.recent[0]?.context ?? {})}
      </div>
      <div className="telemetry-debug-events">
        <strong>Last {stats.recent.length} events</strong>
        <ol className="telemetry-debug-list">
          {[...stats.recent].reverse().slice(0, 50).map((e, i) => (
            <li key={`${e.ts}-${i}`} className="telemetry-debug-event">
              <span className="telemetry-debug-event-name">{e.event}</span>
              <span className="telemetry-debug-event-payload">{JSON.stringify(e.payload)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
