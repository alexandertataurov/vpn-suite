import { MechanicalToggle } from "../MechanicalToggle";
import type { ServerOut, ServerTelemetryOut } from "@vpn-suite/shared/types";

export interface ServerDetailHUDProps {
  server: ServerOut | null;
  telemetry: ServerTelemetryOut | null;
  isLoading?: boolean;
  maintenanceMode?: boolean;
  onMaintenanceChange?: (enabled: boolean) => void;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function ServerDetailHUD({
  server,
  telemetry,
  isLoading = false,
  maintenanceMode = false,
  onMaintenanceChange,
}: ServerDetailHUDProps) {
  if (!server) {
    return (
      <div className="server-detail-hud server-detail-hud--empty">
        <span className="server-detail-hud-placeholder">Select a node</span>
      </div>
    );
  }

  const rx = telemetry?.total_rx_bytes ?? 0;
  const tx = telemetry?.total_tx_bytes ?? 0;
  const peers = telemetry?.peers_count ?? 0;
  const online = telemetry?.online_count ?? 0;
  const source = telemetry?.source ?? "—";

  return (
    <div className={`server-detail-hud admin-card-obsidian ${telemetry ? "" : "server-detail-hud--stale"}`}>
      <div className="server-detail-hud-header">
        <span className="server-detail-hud-name">{server.name ?? server.id}</span>
        <span className="server-detail-hud-status">{server.status ?? "unknown"}</span>
      </div>
      {isLoading ? (
        <div className="server-detail-hud-loading">Live scrape…</div>
      ) : (
        <div className="server-detail-hud-body">
          <dl className="server-detail-hud-grid">
            <dt>Peers</dt>
            <dd>{online} / {peers}</dd>
            <dt>RX</dt>
            <dd>{formatBytes(rx)}</dd>
            <dt>TX</dt>
            <dd>{formatBytes(tx)}</dd>
            <dt>Source</dt>
            <dd>{source}</dd>
            <dt>Last seen</dt>
            <dd>{server.last_seen_at ?? "—"}</dd>
          </dl>
          {onMaintenanceChange != null && (
            <div className="server-detail-hud-maintenance">
              <span className="server-detail-hud-maintenance-label">Maintenance Mode</span>
              <MechanicalToggle
                checked={maintenanceMode}
                onChange={onMaintenanceChange}
                holdMs={500}
                aria-label="Toggle maintenance mode (hold 500ms)"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
