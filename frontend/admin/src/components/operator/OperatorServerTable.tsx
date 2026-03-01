import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconRefresh } from "@/design-system/icons";
import { Button, RelativeTime, Skeleton, EmptyTableState } from "@/design-system";
import type { ServerOut } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import type { ServerRowView } from "../../domain/dashboard/types";
import { formatBytes } from "@vpn-suite/shared";
import { ServerRowDrawer } from "../ServerRowDrawer";

interface OperatorServerTableProps {
  rows: ServerRowView[];
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

const EMPTY_LABEL = "—";
const EMPTY_TITLE = "Metric unavailable (Prometheus/telemetry not available)";

function MetricCell({ value, showBar }: { value: number | null; showBar?: boolean }) {
  const display = value != null ? value.toFixed(1) : EMPTY_LABEL;
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
    <td className={`num ${value == null ? "num-muted" : ""}`} title={value == null ? EMPTY_TITLE : undefined}>
      {display}
    </td>
  );
}

const SKELETON_ROWS = 5;
const COLS = 11;

export function OperatorServerTable({ rows, onSync, loading, filter = "", onFilterChange }: OperatorServerTableProps) {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const serverQuery = useQuery<ServerOut>({
    queryKey: ["servers", selectedServerId],
    queryFn: ({ signal }) => api.get<ServerOut>(`/servers/${selectedServerId}`, { signal }),
    enabled: !!selectedServerId,
  });

  const drawerServer = selectedServerId && serverQuery.data ? serverQuery.data : null;

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        (r.ip && r.ip.toLowerCase().includes(q))
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
    return (
      <EmptyTableState
        className="table-empty"
        title="No servers"
        description="Create a server or check region scope."
      />
    );
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
        <EmptyTableState
          className="table-empty"
          title="No servers match filter"
          description="Clear the filter or change region."
        />
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
          <th className="num" title="Cumulative traffic (total RX+TX for this server)">Throughput</th>
          <th>Last HB</th>
          <th>Freshness</th>
          {onSync && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {filtered.map((r) => (
          <tr
            key={r.id}
            className="operator-server-row operator-server-row--clickable"
            role="button"
            tabIndex={0}
            onClick={() => setSelectedServerId(r.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedServerId(r.id);
              }
            }}
            aria-label={`Open details for ${r.name}`}
          >
            <td>{r.name}</td>
            <td>{r.region}</td>
            <td className="operator-cell-mono">{r.ip}</td>
            <td>
              <span className={`operator-server-status operator-server-status--${r.status === "online" ? "online" : r.status === "degraded" ? "degraded" : "offline"}`}>
                {r.status}
              </span>
            </td>
            <MetricCell value={r.cpuPct} showBar />
            <MetricCell value={r.ramPct} showBar />
            <td className="num">{r.users}</td>
            <td className="num">{formatBytes(r.throughputBps)}</td>
            <td>
              {r.lastHeartbeat ? (
                <RelativeTime date={r.lastHeartbeat} title={new Date(r.lastHeartbeat).toISOString()} />
              ) : (
                "—"
              )}
            </td>
            <td>
              <span className="operator-freshness-cell" title={r.freshness}>
                <span className={`operator-freshness-dot operator-freshness-dot--${r.freshness}`} aria-hidden />
                {r.freshness === "fresh" ? "Fresh" : r.freshness === "degraded" ? "Delayed" : "Stale"}
              </span>
            </td>
            {onSync && (
              <td onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => onSync(r.id)} aria-label={`Sync ${r.name}`}>
                  <IconRefresh size={14} strokeWidth={1.5} aria-hidden /> Sync
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    <ServerRowDrawer
      server={drawerServer}
      onClose={() => setSelectedServerId(null)}
      peerCount={drawerServer ? rows.find((r) => r.id === drawerServer.id)?.users ?? 0 : 0}
      onRestart={onSync ? (s) => onSync(s.id) : undefined}
    />
    </div>
  );
}
