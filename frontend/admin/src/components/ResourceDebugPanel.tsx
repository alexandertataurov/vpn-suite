import { RelativeTime } from "@/design-system";
import { useResourceDebug } from "../utils/resourceDebug";

/**
 * Baseline summary (dev-only):
 * - Servers list and operator overview are API-driven; sessions list is /peers.
 * - Prior silent failures stemmed from refresh actions without state + chart frame overflow.
 * - CPU/RAM gaps traced to missing fallback when snapshots lacked metrics.
 */
export function ResourceDebugPanel() {
  const entries = useResourceDebug();
  if (!entries.length) return null;
  return (
    <div className="resource-debug-panel" role="region" aria-label="Resource debug panel">
      <div className="resource-debug-header">Resource Debug (dev only)</div>
      <div className="resource-debug-grid" role="table">
        <div className="resource-debug-row resource-debug-row--header" role="row">
          <div role="columnheader">Resource</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Calls</div>
          <div role="columnheader">Latency</div>
          <div role="columnheader">Requested</div>
          <div role="columnheader">Updated</div>
          <div role="columnheader">Last Error</div>
        </div>
        {entries.map((entry) => (
          <div key={entry.source} className="resource-debug-row" role="row">
            <div className="resource-debug-source" role="cell">{entry.source}</div>
            <div className={`resource-debug-status resource-debug-status--${entry.status ?? "idle"}`} role="cell">
              {entry.status ?? "idle"}
            </div>
            <div role="cell">{entry.count}</div>
            <div role="cell">{entry.lastLatencyMs != null ? `${entry.lastLatencyMs}ms` : "—"}</div>
            <div role="cell">
              {entry.lastRequestedAt ? (
                <RelativeTime date={entry.lastRequestedAt} updateInterval={5000} />
              ) : (
                "—"
              )}
            </div>
            <div role="cell">
              {entry.updatedAt ? (
                <RelativeTime date={entry.updatedAt} updateInterval={5000} />
              ) : (
                "—"
              )}
            </div>
            <div className="resource-debug-error" role="cell">
              {entry.lastError ? (
                <span title={entry.lastError.message}>
                  {entry.lastError.message}
                  {entry.lastError.code != null ? ` (${entry.lastError.code})` : ""}
                </span>
              ) : (
                "—"
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
