import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, RelativeTime, Skeleton } from "@vpn-suite/shared/ui";
import type { OperatorServerRow } from "@vpn-suite/shared/types";
import { formatBytes } from "@vpn-suite/shared";

interface OperatorServerTableProps {
  rows: OperatorServerRow[];
  onSync?: (id: string) => void;
  loading?: boolean;
  filter?: string;
  onFilterChange?: (v: string) => void;
}

function cpuRamClass(v: number | null): string {
  if (v == null) return "";
  if (v > 80) return "operator-cell--high";
  if (v >= 60) return "operator-cell--medium";
  return "";
}

function MetricCell({ value, showBar }: { value: number | null; showBar?: boolean }) {
  const display = value != null ? value.toFixed(1) : "No data";
  const barPct = value != null ? Math.min(100, Math.max(0, Math.round(value / 5) * 5)) : 0;
  if (showBar && value != null) {
    return (
      <td className={`num ${cpuRamClass(value)}`}>
        <div className="operator-metric-cell">
          <div className="operator-micro-bar" data-pct={barPct}>
            <div className="operator-micro-bar-fill" />
          </div>
          <span>{display}</span>
        </div>
      </td>
    );
  }
  return (
    <td className={`num ${value == null ? "num-muted" : ""}`}>
      {display}
    </td>
  );
}

const SKELETON_ROWS = 5;
const COLS = 11;

export function OperatorServerTable({ rows, onSync, loading, filter = "", onFilterChange }: OperatorServerTableProps) {
  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.ip.toLowerCase().includes(q)
    );
  }, [rows, filter]);

  if (loading) {
    return (
      <div className="operator-server-filter-wrap">
        <table className="operator-server-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Region</th>
              <th>IP</th>
              <th>Status</th>
              <th className="num">CPU %</th>
              <th className="num">RAM %</th>
              <th className="num">Users</th>
              <th className="num">Throughput</th>
              <th>Last HB</th>
              <th>Freshness</th>
              {onSync && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: onSync ? COLS + 1 : COLS }).map((_, j) => (
                  <td key={j}>
                    <Skeleton height={14} width={j === 0 ? "80%" : "60%"} variant="shimmer" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="operator-placeholder">No servers</p>;
  }

  if (filtered.length === 0) {
    return (
      <div className="operator-server-filter-wrap">
        {onFilterChange && (
          <input
            type="search"
            placeholder="Filter by name, region, IP…"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="operator-server-filter"
            aria-label="Filter servers"
          />
        )}
        <p className="operator-placeholder">No servers match filter</p>
      </div>
    );
  }

  return (
    <div className="operator-server-filter-wrap">
      {onFilterChange && (
        <input
          type="search"
          placeholder="Filter by name, region, IP…"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="operator-server-filter"
          aria-label="Filter servers"
        />
      )}
    <table className="operator-server-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Region</th>
          <th>IP</th>
          <th>Status</th>
          <th className="num">CPU %</th>
          <th className="num">RAM %</th>
          <th className="num">Users</th>
          <th className="num">Throughput</th>
          <th>Last HB</th>
          <th>Freshness</th>
          {onSync && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {filtered.map((r) => (
          <tr key={r.id}>
            <td>
              <Link to={r.to}>{r.name}</Link>
            </td>
            <td>{r.region}</td>
            <td>{r.ip}</td>
            <td>
              <span className={`operator-freshness operator-freshness--${r.status === "online" ? "fresh" : r.status === "degraded" ? "degraded" : "stale"}`}>
                {r.status}
              </span>
            </td>
            <MetricCell value={r.cpu_pct} showBar />
            <MetricCell value={r.ram_pct} showBar />
            <td className="num">{r.users}</td>
            <td className="num">{formatBytes(r.throughput_bps)}</td>
            <td>
              {r.last_heartbeat ? (
                <RelativeTime date={r.last_heartbeat} title={new Date(r.last_heartbeat).toISOString()} />
              ) : (
                "—"
              )}
            </td>
            <td>
              <span className={`operator-freshness operator-freshness--muted operator-freshness--${r.freshness}`}>
                {r.freshness}
              </span>
            </td>
            {onSync && (
              <td>
                <Button variant="ghost" size="sm" onClick={() => onSync(r.id)} aria-label={`Sync ${r.name}`}>
                  Sync
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
