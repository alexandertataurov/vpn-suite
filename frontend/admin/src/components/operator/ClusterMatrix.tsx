import { useMemo } from "react";
import type { ClusterMatrixRow } from "../../domain/dashboard/types";
import { formatBytes } from "@vpn-suite/shared";

interface ClusterMatrixProps {
  rows: ClusterMatrixRow[];
}

/** Pip state per node: online (cyan glow), busy (orange pulse), offline (gray) */
type PipState = "online" | "busy" | "offline";

function getPipState(
  index: number,
  row: ClusterMatrixRow
): PipState {
  if (index >= row.online) return "offline";
  const cpuAvg = row.cpuAvg ?? 0;
  const busyCount = cpuAvg >= 60 ? Math.min(row.online, Math.ceil(row.online * (cpuAvg / 100))) : 0;
  return index < busyCount ? "busy" : "online";
}

function ClusterMatrixPip({
  state,
  title,
}: {
  state: PipState;
  title: string;
}) {
  return (
    <span
      className={`cluster-matrix-pip cluster-matrix-pip--${state}`}
      title={title}
      role="img"
      aria-label={state === "online" ? "Online" : state === "busy" ? "Busy" : "Offline"}
    />
  );
}

function RegionPipStrip({ row }: { row: ClusterMatrixRow }) {
  const pips = useMemo(() => {
    const list: PipState[] = [];
    for (let i = 0; i < row.totalNodes; i++) {
      list.push(getPipState(i, row));
    }
    return list;
  }, [row]);

  const tooltip = `Region: ${row.region} | Peers: ${row.users} | CPU: ${row.cpuAvg != null ? row.cpuAvg.toFixed(1) : "—"}% | Throughput: ${formatBytes(row.throughput)}`;

  return (
    <div className="cluster-matrix-pip-strip" title={tooltip}>
      {pips.map((state, i) => (
        <ClusterMatrixPip key={i} state={state} title={tooltip} />
      ))}
      <span className="cluster-matrix-pip-label" aria-hidden>
        {row.region}
      </span>
    </div>
  );
}

export function ClusterMatrix({ rows }: ClusterMatrixProps) {
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.region.localeCompare(b.region)),
    [rows]
  );

  if (rows.length === 0) {
    return <p className="operator-placeholder">No regions</p>;
  }

  return (
    <div className="cluster-matrix-mission-control" role="region" aria-label="VPN Server Matrix">
      <div className="cluster-matrix-pip-grid">
        {sortedRows.map((r) => (
          <RegionPipStrip key={r.region} row={r} />
        ))}
      </div>
      <div className="cluster-matrix-legend" aria-hidden>
        <span className="cluster-matrix-legend-item cluster-matrix-pip--online" />
        <span>Online</span>
        <span className="cluster-matrix-legend-item cluster-matrix-pip--busy" />
        <span>Busy</span>
        <span className="cluster-matrix-legend-item cluster-matrix-pip--offline" />
        <span>Offline</span>
      </div>
    </div>
  );
}
