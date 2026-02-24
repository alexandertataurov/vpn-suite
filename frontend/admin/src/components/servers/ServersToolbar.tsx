import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import {
  Button,
  PrimitiveBadge,
  RelativeTime,
} from "@vpn-suite/shared/ui";
import { streamStatusToVariant } from "@vpn-suite/shared";

export type StreamConnectionState = "live" | "degraded" | "offline";

export interface ServersToolbarProps {
  dataUpdatedAt: number | undefined;
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
  dataUpdatedAt,
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
        <span className="servers-toolbar-last-updated" aria-live="polite">
          {isFetching ? (
            "Updating…"
          ) : dataUpdatedAt ? (
            <>
              Last:{" "}
              <RelativeTime
                date={new Date(dataUpdatedAt)}
                updateInterval={5000}
                title={new Date(dataUpdatedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              />
            </>
          ) : (
            <span title="No successful fetch yet">Last: —</span>
          )}
        </span>
        {hasError ? (
          <PrimitiveBadge variant="danger" size="sm">Error</PrimitiveBadge>
        ) : isStale ? (
          <PrimitiveBadge variant="warning" size="sm">Stale</PrimitiveBadge>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          disabled={isFetching}
          aria-label="Sync now"
        >
          <RefreshCw className="servers-toolbar-icon" aria-hidden strokeWidth={2} />
          {isFetching ? "Syncing…" : "Sync"}
        </Button>
        <PrimitiveBadge
          variant={liveVariant}
          size="sm"
          className="servers-toolbar-live"
          aria-live="polite"
          title={liveTooltip(connectionState, liveIntervalSeconds)}
        >
          <span className="ds-badge-dot-indicator" aria-hidden />
          {liveLabel(connectionState, liveIntervalSeconds)}
        </PrimitiveBadge>
      </div>
      {children ? (
        <div className="servers-toolbar-group servers-toolbar-filters" aria-label="Filters">
          {children}
        </div>
      ) : null}
    </div>
  );
}
