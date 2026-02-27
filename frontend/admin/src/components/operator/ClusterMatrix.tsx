import { useMemo, useState } from "react";
import type { ClusterMatrixRow } from "../../domain/dashboard/types";
import { formatBytes } from "@vpn-suite/shared";

interface ClusterMatrixProps {
  rows: ClusterMatrixRow[];
}

type SortCol = "region" | "cpuAvg" | "ramAvg" | "users" | "health" | null;
type SortDir = "asc" | "desc";

function cellClass(v: number | null): string {
  if (v == null) return "";
  if (v > 80) return "operator-cell--high";
  if (v >= 60) return "operator-cell--medium";
  return "";
}

const EMPTY_LABEL = "—";
const EMPTY_TITLE = "Metric unavailable (Prometheus/telemetry not available)";

function MetricCell({
  value,
  showBar,
}: {
  value: number | null;
  showBar?: boolean;
}) {
  const display = value != null ? value.toFixed(1) : EMPTY_LABEL;
  const barPct = value != null ? Math.min(100, Math.max(0, Math.round(value / 5) * 5)) : 0;
  return (
    <td className={`num ${cellClass(value)}`} title={value == null ? EMPTY_TITLE : undefined}>
      {showBar && value != null ? (
        <div className="operator-metric-cell">
          <div className="operator-micro-bar" data-pct={barPct}>
            <div className="operator-micro-bar-fill" />
          </div>
          <span>{display}</span>
        </div>
      ) : (
        <span className={value == null ? "num-muted" : ""}>{display}</span>
      )}
    </td>
  );
}

function SortTh({
  col,
  currentCol,
  dir,
  onSort,
  children,
  className = "",
}: {
  col: SortCol;
  currentCol: SortCol;
  dir: SortDir;
  onSort: (c: SortCol) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = col === currentCol;
  return (
    <th
      className={className}
      role="button"
      tabIndex={0}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
      onClick={() => onSort(col)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(col);
        }
      }}
    >
      {children}
      {active && <span aria-hidden>{dir === "asc" ? " ↑" : " ↓"}</span>}
    </th>
  );
}

export function ClusterMatrix({ rows }: ClusterMatrixProps) {
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (col: SortCol) => {
    if (col === sortCol && sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      let av: string | number | null;
      let bv: string | number | null;
      const ord = (s: string) => (s === "ok" ? 0 : s === "degraded" ? 1 : 2);
      switch (sortCol) {
        case "region":
          av = a.region;
          bv = b.region;
          return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        case "cpuAvg":
          av = a.cpuAvg ?? -1;
          bv = b.cpuAvg ?? -1;
          return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
        case "ramAvg":
          av = a.ramAvg ?? -1;
          bv = b.ramAvg ?? -1;
          return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
        case "users":
          av = a.users;
          bv = b.users;
          return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
        case "health":
          av = ord(a.health);
          bv = ord(b.health);
          return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
        default:
          return 0;
      }
    });
  }, [rows, sortCol, sortDir]);

  if (rows.length === 0) {
    return <p className="operator-placeholder">No regions</p>;
  }

  return (
    <table className="operator-table">
      <thead>
        <tr>
          <SortTh col="region" currentCol={sortCol} dir={sortDir} onSort={handleSort}>
            Region
          </SortTh>
          <th className="num">Total</th>
          <th className="num">Online</th>
          <SortTh col="cpuAvg" currentCol={sortCol} dir={sortDir} onSort={handleSort} className="num">
            CPU %
          </SortTh>
          <SortTh col="ramAvg" currentCol={sortCol} dir={sortDir} onSort={handleSort} className="num">
            RAM %
          </SortTh>
          <SortTh col="users" currentCol={sortCol} dir={sortDir} onSort={handleSort} className="num">
            Users
          </SortTh>
          <th className="num" title="Cumulative traffic (total RX+TX for region)">Throughput</th>
          <th className="num">Error %</th>
          <SortTh col="health" currentCol={sortCol} dir={sortDir} onSort={handleSort}>
            Health
          </SortTh>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((r) => (
          <tr key={r.region}>
            <td>{r.region}</td>
            <td className="num" title="Nodes in region">{r.totalNodes}</td>
            <td className="num" title="Nodes reporting healthy/ok/degraded">{r.online}</td>
            <MetricCell value={r.cpuAvg} showBar />
            <MetricCell value={r.ramAvg} showBar />
            <td className="num">{r.users}</td>
            <td className="num">{formatBytes(r.throughput)}</td>
            <td className={`num ${r.errorPct != null ? "" : "num-muted"}`} title={r.errorPct == null ? EMPTY_TITLE : undefined}>
              {r.errorPct != null ? r.errorPct.toFixed(2) : EMPTY_LABEL}
            </td>
            <td>
              <span className={`operator-freshness operator-freshness--${r.health === "ok" ? "fresh" : r.health === "degraded" ? "degraded" : "stale"}`}>
                {r.health}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
