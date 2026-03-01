import { FleetOverview } from "./FleetOverview";
import { ServerDetailHUD } from "./ServerDetailHUD";
import type { ServerOut, ServerTelemetryOut } from "@vpn-suite/shared/types";
import type { ServersSnapshotSummaryOut } from "../../hooks/useServerList";

export interface NodeCommanderLayoutProps {
  servers: ServerOut[];
  snapshotSummary?: ServersSnapshotSummaryOut | null;
  selectedServer: ServerOut | null;
  telemetry: ServerTelemetryOut | null;
  telemetryLoading?: boolean;
  maintenanceMode?: boolean;
  onSelectServer: (server: ServerOut) => void;
  onMaintenanceChange?: (enabled: boolean) => void;
}

/** Split-pane: Fleet Overview (left) + Detail HUD (right). */
export function NodeCommanderLayout({
  servers,
  snapshotSummary,
  selectedServer,
  telemetry,
  telemetryLoading = false,
  maintenanceMode = false,
  onSelectServer,
  onMaintenanceChange,
}: NodeCommanderLayoutProps) {
  return (
    <div className="node-commander-layout">
      <aside className="node-commander-fleet" aria-label="Fleet overview">
        <FleetOverview
          servers={servers}
          snapshotSummary={snapshotSummary}
          selectedId={selectedServer?.id ?? null}
          onSelect={onSelectServer}
        />
      </aside>
      <main className="node-commander-detail" aria-label="Server detail">
        <ServerDetailHUD
          server={selectedServer}
          telemetry={telemetry}
          isLoading={telemetryLoading}
          maintenanceMode={maintenanceMode}
          onMaintenanceChange={onMaintenanceChange}
        />
      </main>
    </div>
  );
}
