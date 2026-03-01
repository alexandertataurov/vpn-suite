import { useNavigate } from "react-router-dom";
import { RelativeTime, StatusBadge } from "@/design-system";
import type { ServerOut, ServersSnapshotSummaryOut } from "@vpn-suite/shared/types";
import type { ServersTelemetrySummaryOut } from "../../hooks/useServerList";
import { getServerVisualStatus } from "../ServerRow";
import { FreshnessBadge } from "../operator/FreshnessBadge";
import { getFreshnessLevel } from "../../constants/freshness";
import { RowActionsMenu } from "./RowActionsMenu";
import { Card } from "@/design-system";

export interface ServerCardProps {
  server: ServerOut;
  snapshotSummary: ServersSnapshotSummaryOut | undefined;
  telemetrySummary: ServersTelemetrySummaryOut | undefined;
  syncingServerId: string | null;
  onRowClick: () => void;
  onSync: () => void;
  onReconcile: () => void;
  onIssueConfig: () => void;
  onRestart: () => void;
  onDrainUndrain: () => void;
  onDelete?: () => void;
}

function visualStatusToStatusBadge(v: ReturnType<typeof getServerVisualStatus>): "ok" | "down" | "degraded" {
  if (v === "online") return "ok";
  if (v === "offline") return "down";
  return "degraded";
}

export function ServerCard({
  server,
  syncingServerId,
  onRowClick,
  onSync,
  onReconcile,
  onIssueConfig,
  onRestart,
  onDrainUndrain,
  onDelete,
}: ServerCardProps) {
  const navigate = useNavigate();
  const visualStatus = getServerVisualStatus(server);
  const statusBadgeStatus = visualStatusToStatusBadge(visualStatus);
  const seenLevel = getFreshnessLevel(server.last_seen_at);

  return (
    <Card
      variant="outline"
      className="server-card-xs"
      role="button"
      tabIndex={0}
      onClick={onRowClick}
      onKeyDown={(e) => e.key === "Enter" && onRowClick()}
    >
      <div className="server-card-xs__row">
        <div className="server-card-xs__main">
          <StatusBadge status={statusBadgeStatus} label={(server.status ?? "unknown").toLowerCase()} />
          <span className="server-card-xs__name" title={server.name || server.id}>
            {server.name || `Node ${server.id.slice(0, 8)}`}
          </span>
        </div>
        <div className="server-card-xs__actions" onClick={(e) => e.stopPropagation()}>
          <RowActionsMenu
            server={server}
            syncing={syncingServerId === server.id}
            onSync={onSync}
            onConfigure={() => navigate(`/servers/${server.id}/edit`)}
            onRestart={onRestart}
            onDrainUndrain={onDrainUndrain}
            onReconcile={onReconcile}
            onIssueConfig={onIssueConfig}
            onDelete={onDelete}
          />
        </div>
      </div>
      <div className="server-card-xs__meta">
        <span>{server.region ?? "Unknown"}</span>
        <span className="server-card-xs__lastseen">
          {server.last_seen_at ? (
            seenLevel === "stale" || seenLevel === "degraded" ? (
              <FreshnessBadge freshness={seenLevel} title={`${seenLevel} (last seen)`}>
                <RelativeTime date={server.last_seen_at} updateInterval={5000} />
              </FreshnessBadge>
            ) : (
              <RelativeTime date={server.last_seen_at} updateInterval={5000} />
            )
          ) : (
            "No data"
          )}
        </span>
      </div>
    </Card>
  );
}
