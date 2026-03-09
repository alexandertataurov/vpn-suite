import type { HTMLAttributes } from "react";
import {
  MissionChip,
  MissionModuleHead,
  MissionProgressBar,
  MissionPrimaryButton,
  MissionSecondaryButton,
} from "./MissionPrimitives";

export interface ServerCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Server id (used by parent for key) */
  id?: string;
  name: string;
  region?: string | null;
  avgPingMs?: number | null;
  loadPercent?: number;
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
  loadPercent = 0,
  isCurrent = false,
  isPending = false,
  onSelect,
  disabled = false,
  className = "",
  ...props
}: ServerCardProps) {
  const code = (region ?? name ?? "??").slice(0, 2).toUpperCase();
  const load = Math.round(loadPercent);
  const tone = load >= 85 ? "danger" : load >= 65 ? "warning" : "healthy";

  return (
    <article className={`module-card ${className}`.trim()} {...props}>
      <MissionModuleHead
        label={`Node ${code}`}
        chip={
          <MissionChip tone={isCurrent ? "green" : "neutral"}>
            {isCurrent ? "Current" : "Available"}
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
            {avgPingMs != null ? `${Math.round(avgPingMs)}ms` : "--"}
          </div>
        </div>
      </div>
      <div className="server-load">
        <div className="module-head">
          <span className="dc-key">Load</span>
          <span className="dc-val miniapp-tnum">{load}%</span>
        </div>
        <MissionProgressBar
          percent={loadPercent}
          tone={tone}
          staticFill
          ariaLabel={`${name} load ${load}%`}
        />
      </div>
      {isCurrent ? (
        <MissionSecondaryButton onClick={onSelect} disabled={disabled || isPending}>
          {isPending ? "Selecting…" : "Current"}
        </MissionSecondaryButton>
      ) : (
        <MissionPrimaryButton onClick={onSelect} disabled={disabled || isPending}>
          {isPending ? "Selecting…" : "Select"}
        </MissionPrimaryButton>
      )}
    </article>
  );
}
