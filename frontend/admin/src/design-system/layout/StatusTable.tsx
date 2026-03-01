import "./StatusTable.css";
import { cn } from "@vpn-suite/shared";
import { Badge } from "@/design-system/primitives";
import { MiniSparkline } from "@/components";

export type StatusTableStatus = "online" | "degraded" | "offline";

export interface StatusTableRow {
  id: string;
  satelliteId: string;
  orbitalVelocity: number;
  status: StatusTableStatus;
  latencyData: number[];
}

export interface StatusTableProps {
  rows: StatusTableRow[];
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  className?: string;
}

function StatusBadge({ status }: { status: StatusTableStatus }) {
  const v = status === "online" ? "nominal" : status === "degraded" ? "warning" : "critical";
  const label = status.toUpperCase();
  return <Badge variant={v}>{label}</Badge>;
}

export function StatusTable({ rows, selectedIds, onSelectionChange, className }: StatusTableProps) {
  const toggle = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className={cn("ds-status-table", className)} role="grid">
      <div className="ds-status-table__header" role="rowgroup">
        <div className="ds-status-table__row" role="row">
          {onSelectionChange != null && <div className="ds-status-table__cell ds-status-table__cell--check" role="columnheader" />}
          <div className="ds-status-table__cell" role="columnheader">SATELLITE_ID</div>
          <div className="ds-status-table__cell ds-status-table__cell--right" role="columnheader">ORBITAL_VELOCITY</div>
          <div className="ds-status-table__cell" role="columnheader">STATUS</div>
          <div className="ds-status-table__cell" role="columnheader">LATENCY</div>
        </div>
      </div>
      <div className="ds-status-table__body" role="rowgroup">
        {rows.map((row) => {
          const selected = selectedIds?.has(row.id) ?? false;
          return (
            <div
              key={row.id}
              className={cn("ds-status-table__row", selected && "ds-status-table__row--selected")}
              role="row"
              onClick={() => toggle(row.id)}
            >
              {onSelectionChange != null && <div className="ds-status-table__cell ds-status-table__cell--check" role="gridcell" />}
              <div className="ds-status-table__cell ds-status-table__cell--mono" role="gridcell">{row.satelliteId}</div>
              <div className="ds-status-table__cell ds-status-table__cell--mono ds-status-table__cell--right" role="gridcell">{row.orbitalVelocity.toFixed(1)}</div>
              <div className="ds-status-table__cell" role="gridcell"><StatusBadge status={row.status} /></div>
              <div className="ds-status-table__cell" role="gridcell"><MiniSparkline data={row.latencyData} color="var(--color-accent)" /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
