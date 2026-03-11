import type { HTMLAttributes } from "react";
import { MissionProgressBar } from "../mission/Mission";
import { DataCell, DataGrid } from "../ui/DataGrid";
import { StatusChip } from "../ui/StatusChip";
import { SelectionCard } from "./SelectionCard";

export interface ServerCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  id?: string;
  name: string;
  region?: string | null;
  avgPingMs?: number | null;
  loadPercent?: number | null;
  isCurrent?: boolean;
  isPending?: boolean;
  onSelect: () => void;
  onDeselect?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function loadMeta(loadPercent: number | null) {
  if (loadPercent == null || Number.isNaN(loadPercent)) {
    return { tone: "healthy" as const, suffix: "unavailable", pulse: false };
  }
  if (loadPercent >= 96) {
    return { tone: "danger" as const, suffix: "at capacity", pulse: true };
  }
  if (loadPercent >= 81) {
    return { tone: "danger" as const, suffix: "high load", pulse: false };
  }
  if (loadPercent >= 61) {
    return { tone: "warning" as const, suffix: "advisory", pulse: false };
  }
  return { tone: "healthy" as const, suffix: "", pulse: false };
}

/**
 * Reusable server selection card. Location, latency, load, and action state.
 */
export function ServerCard({
  name,
  region,
  avgPingMs,
  loadPercent,
  isCurrent = false,
  isPending = false,
  onSelect,
  onDeselect,
  disabled = false,
  loading = false,
  className = "",
  ...props
}: ServerCardProps) {
  const code = (region ?? name ?? "??").slice(0, 2).toUpperCase();
  const hasLoad = typeof loadPercent === "number" && !Number.isNaN(loadPercent);
  const load = hasLoad ? Math.round(loadPercent as number) : null;
  const { tone, suffix, pulse } = loadMeta(load);
  const actionLabel = isCurrent ? "Change server" : "Select server";
  const actionHandler = isCurrent ? (onDeselect ?? onSelect) : onSelect;
  const latencyTone = avgPingMs == null ? "mut" : avgPingMs > 220 ? "amber" : "green";
  const loadLabel =
    load == null
      ? "Unavailable"
      : suffix
        ? `${load}% ${suffix}`
        : `${load}%`;

  return (
    <SelectionCard
      title={`Location ${code}`}
      subtitle={name}
      selected={isCurrent}
      disabled={disabled || isPending}
      onSelect={actionHandler}
      actionLabel={isPending ? "Saving…" : actionLabel}
      badge={
        <StatusChip variant={isCurrent ? "active" : "info"}>
          {isCurrent ? "Selected" : "Available"}
        </StatusChip>
      }
      metadata={
        <>
          <DataGrid columns={2}>
            <DataCell
              label="Latency"
              value={avgPingMs != null ? `${Math.round(avgPingMs)} ms` : "Unavailable"}
              valueTone={latencyTone}
              cellType="latency"
              loading={loading}
            />
            <DataCell
              label="Region"
              value={region ?? "Auto"}
              valueTone="teal"
              tooltip={name}
            />
          </DataGrid>
          <div className={`server-load ${pulse ? "server-load--pulse" : ""}`}>
            <div className="module-head">
              <span className="dc-key">Load</span>
              <span className="dc-val miniapp-tnum">{loadLabel}</span>
            </div>
            <MissionProgressBar
              percent={hasLoad && load != null ? load : 0}
              tone={tone}
              staticFill
              ariaLabel={hasLoad && load != null ? `${name} load ${load}%` : `${name} load unknown`}
            />
          </div>
        </>
      }
      className={[
        "server-card",
        isCurrent ? "server-card--selected" : "",
        isPending ? "server-card--pending" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
