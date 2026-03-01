import type { ReactNode } from "react";
import { IconRefresh } from "@/design-system/icons";
import { Button, Badge } from "@/design-system";
import { streamStatusToVariant } from "@vpn-suite/shared";

export type StreamConnectionState = "live" | "degraded" | "offline";

export interface ServersToolbarProps {
  /** @deprecated Use PageHeader lastUpdated instead; kept for sync state only */
  dataUpdatedAt?: number | undefined;
  isFetching: boolean;
  onSync: () => void | Promise<void>;
  connectionState: StreamConnectionState;
  isStale?: boolean;
  hasError?: boolean;
  /** Polling/stream interval in seconds when live. Default 30. */
  liveIntervalSeconds?: number;
  /** Use neutral variant when live (muted, not saturated green). Default true. */
  mutedWhenLive?: boolean;
  children?: ReactNode;
}

function liveLabel(state: StreamConnectionState, intervalSec: number): string {
  switch (state) {
    case "live":
      return `Live · ${intervalSec}s`;
    case "degraded":
      return "Degraded";
    case "offline":
      return "Offline";
    default:
      return "Offline";
  }
}

function liveTooltip(state: StreamConnectionState, intervalSec: number): string {
  switch (state) {
    case "live":
      return `Live updates every ${intervalSec}s`;
    case "degraded":
      return "Live degraded, using polling";
    case "offline":
      return "Backend unreachable";
    default:
      return "Offline";
  }
}

export function ServersToolbar({
  isFetching,
  onSync,
  connectionState,
  isStale = false,
  hasError = false,
  liveIntervalSeconds = 30,
  mutedWhenLive = true,
  children,
}: ServersToolbarProps) {
  const liveVariant = mutedWhenLive && connectionState === "live" ? "neutral" : streamStatusToVariant(connectionState);
  return (
    <div className="servers-toolbar" role="toolbar">
      <div className="servers-toolbar-group" aria-label="Status and sync">
        {hasError ? (
          <Badge variant="critical" size="sm">Error</Badge>
        ) : isStale ? (
          <Badge variant="warning" size="sm">Stale</Badge>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          disabled={isFetching}
          aria-label="Sync now"
        >
          <IconRefresh className="servers-toolbar-icon" aria-hidden strokeWidth={1.5} />
          {isFetching ? "Syncing…" : "Sync"}
        </Button>
        <Badge
          variant={liveVariant}
          size="sm"
          className="servers-toolbar-live"
          aria-live="polite"
          title={liveTooltip(connectionState, liveIntervalSeconds)}
          pulse={connectionState === "live"}
        >
          {liveLabel(connectionState, liveIntervalSeconds)}
        </Badge>
      </div>
      {children ? (
        <div className="servers-toolbar-group servers-toolbar-filters" aria-label="Filters">
          {children}
        </div>
      ) : null}
    </div>
  );
}
