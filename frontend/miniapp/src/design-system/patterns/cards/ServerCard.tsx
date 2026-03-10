import type { HTMLAttributes } from "react";
import {
  MissionChip,
  MissionModuleHead,
  MissionProgressBar,
  MissionPrimaryButton,
  MissionSecondaryButton,
} from "../mission/Mission";

export interface ServerCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Server id (used by parent for key) */
  id?: string;
  name: string;
  region?: string | null;
  avgPingMs?: number | null;
  loadPercent?: number | null;
  isCurrent?: boolean;
  isPending?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Reusable server selection card. Location, latency, load, Select/Current button.
 */
export function ServerCard({
  name,
  region,
  avgPingMs,
  loadPercent,
  isCurrent = false,
  isPending = false,
  onSelect,
  disabled = false,
  className = "",
  ...props
}: ServerCardProps) {
  const code = (region ?? name ?? "??").slice(0, 2).toUpperCase();
  const hasLoad = typeof loadPercent === "number" && !Number.isNaN(loadPercent);
  const load = hasLoad ? Math.round(loadPercent as number) : null;
  const tone = !hasLoad || load == null
    ? "healthy"
    : load >= 85
      ? "danger"
      : load >= 65
        ? "warning"
        : "healthy";

  return (
    <article
      className={[
        "module-card",
        "server-card",
        isCurrent ? "server-card--selected" : "",
        isPending ? "server-card--pending" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      <MissionModuleHead
        label={`Location ${code}`}
        chip={
          <MissionChip tone={isCurrent ? "green" : "neutral"}>
            {isCurrent ? "Selected" : "Available"}
          </MissionChip>
        }
      />
      <div className="data-grid">
        <div className="data-cell">
          <div className="dc-key">Location</div>
          <div className="dc-val teal">{name}</div>
        </div>
        <div className="data-cell">
          <div className="dc-key">Latency</div>
          <div className={`dc-val ${avgPingMs != null ? "green" : "mut"} miniapp-tnum`}>
            {avgPingMs != null ? `${Math.round(avgPingMs)}ms advisory` : "Unavailable"}
          </div>
        </div>
      </div>
      <div className="server-load">
        <div className="module-head">
          <span className="dc-key">Load</span>
          <span className="dc-val miniapp-tnum">{load != null ? `${load}% advisory` : "Unavailable"}</span>
        </div>
        <MissionProgressBar
          percent={hasLoad && load != null ? load : 0}
          tone={tone}
          staticFill
          ariaLabel={hasLoad && load != null ? `${name} load ${load}%` : `${name} load unknown`}
        />
      </div>
      {isCurrent ? (
        <MissionSecondaryButton onClick={onSelect} disabled={disabled || isPending}>
          {isPending ? "Saving…" : "Selected"}
        </MissionSecondaryButton>
      ) : (
        <MissionPrimaryButton onClick={onSelect} disabled={disabled || isPending}>
          {isPending ? "Saving…" : "Select server"}
        </MissionPrimaryButton>
      )}
    </article>
  );
}
