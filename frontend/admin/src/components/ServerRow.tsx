import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { getFreshnessLevel } from "../constants/freshness";
import { FreshnessBadge } from "./operator/FreshnessBadge";
import { RowActionsMenu } from "./servers/RowActionsMenu";
import { Button, Checkbox, RelativeTime, StatusBadge, PrimitiveTableRow } from "@vpn-suite/shared/ui";
import type { ServerOut, ServersSnapshotSummaryOut } from "@vpn-suite/shared/types";
import type { ServersTelemetrySummaryOut } from "../hooks/useServerList";

export type ServerVisualStatus = "online" | "offline" | "maintenance";

export function getServerVisualStatus(server: ServerOut): ServerVisualStatus {
  if (!server.is_active) return "offline";
  const status = (server.status ?? "unknown").toLowerCase();
  if (status === "offline") return "offline";
  if (status === "degraded" || status === "unknown") return "maintenance";
  return "online";
}

function visualStatusToStatusBadge(v: ServerVisualStatus): "ok" | "down" | "degraded" {
  if (v === "online") return "ok";
  if (v === "offline") return "down";
  return "degraded";
}

/** @deprecated Use getFreshnessLevel from constants/freshness for consistent badges. */
export function isStale(iso: string | null | undefined): boolean {
  return ["stale", "unknown"].includes(getFreshnessLevel(iso));
}

/** Snapshot older than this (ms) is considered stale for operator attention. Default 10 min. */
export const SNAPSHOT_STALE_MS = 10 * 60 * 1000;

export function isSnapshotStale(iso: string | null | undefined, thresholdMs = SNAPSHOT_STALE_MS): boolean {
  return ["stale", "unknown"].includes(getFreshnessLevel(iso, thresholdMs));
}

function renderPeersCell(
  server: ServerOut,
  snapshotSummary: ServersSnapshotSummaryOut | undefined,
  devicesByServer: Map<string, number>
): React.ReactNode {
  const snap = snapshotSummary?.servers?.[server.id];
  const activeUsers = devicesByServer.get(server.id) ?? 0;
  const capacity = server.max_connections ?? null;
  if (snap && (snap.active_peers != null || snap.total_peers != null)) {
    const a = snap.active_peers ?? 0;
    const t = snap.total_peers ?? 0;
    return t > 0 ? `${a} / ${t}` : `${t} peers`;
  }
  return capacity != null ? `${activeUsers} / ${capacity}` : `${activeUsers} peers`;
}

function renderIpsCell(server: ServerOut, snapshotSummary: ServersSnapshotSummaryOut | undefined): React.ReactNode {
  const snap = snapshotSummary?.servers?.[server.id];
  if (snap && (snap.used_ips != null || snap.total_ips != null)) {
    const u = snap.used_ips ?? 0;
    const t = snap.total_ips ?? undefined;
    if (t != null && t > 0) return `${u} / ${t}`;
    if (snap.used_ips != null && t == null) return `${u} / —`;
    return null;
  }
  return null;
}

function renderTelemetryCell(
  server: ServerOut,
  snapshotSummary: ServersSnapshotSummaryOut | undefined,
  telemetrySummary: ServersTelemetrySummaryOut | undefined,
  healthInColumn: boolean,
  snapshotStaleThresholdMs: number
): React.ReactNode {
  const snap = snapshotSummary?.servers?.[server.id];
  const telemetry = telemetrySummary?.servers?.[server.id];
  const snapHasMetrics = snap && (snap.cpu_pct != null || snap.ram_pct != null);
  const t = snapHasMetrics ? snap : telemetry;
  const telemetryLast = telemetry?.last_telemetry_at ?? telemetry?.last_metrics_at ?? null;
  const telemetryStatus = telemetry?.telemetry_status;
  const metricsFreshness = getFreshnessLevel(telemetryLast, snapshotStaleThresholdMs);
  const showStale = telemetryStatus ? telemetryStatus === "stale" : metricsFreshness === "stale";
  if (t && (t.cpu_pct != null || t.ram_pct != null)) {
    return (
      <span className="ref-telemetry-mini" title={snap?.source === "snapshot" ? "From snapshot" : undefined}>
        {t.cpu_pct != null && `CPU ${Number(t.cpu_pct).toFixed(0)}%`}
        {t.cpu_pct != null && t.ram_pct != null && " · "}
        {t.ram_pct != null && `RAM ${Number(t.ram_pct).toFixed(0)}%`}
        {telemetryLast && showStale && (
          <span className="ref-telemetry-stale"> · Telemetry stale</span>
        )}
      </span>
    );
  }
  if (t && (t as { health_score?: number }).health_score != null) {
    if (healthInColumn) return <span className="ref-telemetry-mini" title="Agent health (see Health column)">Agent</span>;
    return (
      <span className="ref-telemetry-mini" title="From agent">
        Health {Math.round(Number((t as { health_score?: number }).health_score))}%
      </span>
    );
  }
  if (telemetryStatus === "error") {
    return (
      <span className="table-cell-empty ref-telemetry-unavail" title="Telemetry error">
        Telemetry error
      </span>
    );
  }
  if (telemetryLast) {
    return (
      <span className="table-cell-empty ref-telemetry-unavail" title="Telemetry unavailable">
        No data (last metric: {new Date(telemetryLast).toLocaleTimeString(undefined, { hour12: false })})
      </span>
    );
  }
  return <span className="table-cell-empty ref-telemetry-unavail" title="Telemetry unavailable">No data</span>;
}

export interface ServerRowProps {
  server: ServerOut;
  selected: boolean;
  onSelect: () => void;
  snapshotSummary: ServersSnapshotSummaryOut | undefined;
  telemetrySummary: ServersTelemetrySummaryOut | undefined;
  devicesByServer: Map<string, number>;
  syncingServerId: string | null;
  virtualStyle?: React.CSSProperties;
  onRowClick: () => void;
  onSync: () => void;
  onReconcile: () => void;
  onIssueConfig: () => void;
  onRestart: () => void;
  onDrainUndrain: () => void;
  /** Called when Delete is chosen (guarded by permission). */
  onDelete?: () => void;
  /** Threshold in ms for snapshot staleness warning. Default 10 min. */
  snapshotStaleThresholdMs?: number;
  showInlineDetails?: boolean;
}

function ServerRowInner({
  server,
  selected,
  onSelect,
  snapshotSummary,
  telemetrySummary,
  devicesByServer,
  syncingServerId,
  virtualStyle,
  onRowClick,
  onSync,
  onReconcile,
  onIssueConfig,
  onRestart,
  onDrainUndrain,
  onDelete,
  snapshotStaleThresholdMs = SNAPSHOT_STALE_MS,
  showInlineDetails = false,
}: ServerRowProps) {
  const navigate = useNavigate();
  const visualStatus = getServerVisualStatus(server);
  const statusBadgeStatus = visualStatusToStatusBadge(visualStatus);
  const healthScore = snapshotSummary?.servers?.[server.id]?.health_score ?? server.health_score;
  const healthPct =
    healthScore != null
      ? Math.min(100, Math.max(0, Math.round(Number(healthScore) / 5) * 5))
      : 0;
  const seenLevel = getFreshnessLevel(server.last_seen_at);
  const seenStale = isStale(server.last_seen_at);
  const snapStale = isSnapshotStale(server.last_snapshot_at, snapshotStaleThresholdMs);
  const telemetry = telemetrySummary?.servers?.[server.id];
  const telemetryLast = telemetry?.last_telemetry_at ?? telemetry?.last_metrics_at ?? null;
  const telemetryStatus = telemetry?.telemetry_status;
  const telemetryStale = telemetryStatus
    ? telemetryStatus === "stale"
    : getFreshnessLevel(telemetryLast, snapshotStaleThresholdMs) === "stale";
  const hasMetrics =
    snapshotSummary?.servers?.[server.id]?.cpu_pct != null ||
    snapshotSummary?.servers?.[server.id]?.ram_pct != null ||
    telemetry?.cpu_pct != null ||
    telemetry?.ram_pct != null;
  const reasonDisabled = !server.is_active;
  const reasonStale = snapStale || telemetryStale || seenStale;
  const reasonNoTelemetry = telemetryStatus === "missing" || (!hasMetrics && !!telemetryLast);
  const reasonTelemetryError = telemetryStatus === "error";
  const reasons: React.ReactNode[] = [];
  if (reasonDisabled) reasons.push("Disabled");
  if (reasonStale) reasons.push("Telemetry stale");
  if (reasonTelemetryError) reasons.push("Telemetry error");
  if (reasonNoTelemetry) {
    reasons.push(
      telemetryLast ? (
        <>
          No telemetry (last metric:{" "}
          <RelativeTime date={telemetryLast} updateInterval={5000} />
          )
        </>
      ) : (
        "No telemetry"
      )
    );
  }

  return (
    <PrimitiveTableRow
      className="table-row-clickable"
      style={virtualStyle}
      onClick={onRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onRowClick()}
    >
      <td onClick={(e) => e.stopPropagation()} className="servers-table-col-check">
        <Checkbox
          label=""
          checked={selected}
          onChange={onSelect}
          aria-label={`Select ${server.name || server.id}`}
        />
      </td>
      <td className="servers-table-col-status">
        <StatusBadge status={statusBadgeStatus} label={(server.status ?? "unknown").toLowerCase()} />
      </td>
      <td className="servers-table-col-health table-cell-numeric table-cell-align-right">
        {healthScore != null ? (
          <span className="table-cell-health" title={`Health: ${Math.round(Number(healthScore))}%`}>
            <span className="table-cell-health-value">{Math.round(Number(healthScore))}</span>
            <span className="table-cell-health-track">
              <span
                className="table-cell-health-bar"
                data-pct={healthPct}
                data-level={Number(healthScore) >= 95 ? "good" : Number(healthScore) >= 80 ? "warn" : "low"}
              />
            </span>
          </span>
        ) : (
          <span className="table-cell-empty" title="No health data">No data</span>
        )}
      </td>
      <td className="servers-table-col-name">
        <span className="table-cell-truncate" title={server.name || `Node ${server.id.slice(0, 8)}`}>
          {server.name || `Node ${server.id.slice(0, 8)}`}
        </span>
        {reasons.length > 0 && (
          <div className="servers-row-reason">
            <span className="servers-row-reason-text">
              {reasons.map((r, idx) => (
                <span key={idx}>{idx > 0 ? " · " : ""}{r}</span>
              ))}
            </span>
            {(snapStale || !server.last_snapshot_at) && (
              <Button
                variant="ghost"
                size="sm"
                className="servers-row-retry"
                onClick={(e) => {
                  e.stopPropagation();
                  onSync();
                }}
                disabled={syncingServerId === server.id}
              >
                Retry sync
              </Button>
            )}
          </div>
        )}
        {showInlineDetails && (
          <details className="servers-row-details" onClick={(e) => e.stopPropagation()}>
            <summary className="servers-row-details-summary">Details</summary>
            <div className="servers-row-details-body">
              <span>Last seen: {server.last_seen_at ? <RelativeTime date={server.last_seen_at} /> : "—"}</span>
              <span>Last sync: {server.last_snapshot_at ? <RelativeTime date={server.last_snapshot_at} /> : "—"}</span>
              <span>Last metric: {telemetryLast ? <RelativeTime date={telemetryLast} /> : "—"}</span>
            </div>
          </details>
        )}
      </td>
      <td className="servers-table-col-region">{server.region ?? "Unknown"}</td>
      <td className={`servers-table-col-lastseen ${seenStale ? "table-cell-stale" : ""}`.trim()}>
        {server.last_seen_at ? (
          seenLevel === "stale" || seenLevel === "degraded" ? (
            <FreshnessBadge freshness={seenLevel} title={`${seenLevel} (last seen)`}>
              <RelativeTime date={server.last_seen_at} updateInterval={5000} />
            </FreshnessBadge>
          ) : (
            <RelativeTime date={server.last_seen_at} updateInterval={5000} />
          )
        ) : (
          <span className="table-cell-empty" title="No timestamp">No data</span>
        )}
      </td>
      <td className={`servers-table-col-lastsync ${snapStale ? "table-cell-snapshot-stale" : ""}`.trim()}>
        {server.last_snapshot_at ? (
          snapStale ? (
            <FreshnessBadge freshness="stale" title="Data may be stale. Click Sync to refresh.">
              <RelativeTime date={server.last_snapshot_at} updateInterval={5000} />
            </FreshnessBadge>
          ) : (
            <RelativeTime date={server.last_snapshot_at} updateInterval={5000} />
          )
        ) : (
          <span className="table-cell-empty" title="No timestamp from source">Unknown</span>
        )}
      </td>
      <td className="servers-table-col-peers table-cell-numeric table-cell-align-right">{renderPeersCell(server, snapshotSummary, devicesByServer)}</td>
      <td className="servers-table-col-ips table-cell-numeric table-cell-align-right">{renderIpsCell(server, snapshotSummary) ?? <span className="table-cell-empty" title="IP data unavailable">No data</span>}</td>
      <td className="servers-table-col-telemetry">{renderTelemetryCell(server, snapshotSummary, telemetrySummary, healthScore != null, snapshotStaleThresholdMs)}</td>
      <td onClick={(e) => e.stopPropagation()} className="servers-table-col-actions table-cell-actions">
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
      </td>
    </PrimitiveTableRow>
  );
}

export const ServerRow = memo(ServerRowInner);
