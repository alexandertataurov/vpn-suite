import { AlertTriangle, Pause, Play } from "lucide-react";
import { Button } from "@vpn-suite/shared/ui";
import type { DeviceSummaryOut } from "@vpn-suite/shared/types";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 min

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "< 1 min ago";
  if (diff < 3600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < 86400_000) return `${Math.round(diff / 3600_000)} h ago`;
  return `${Math.round(diff / 86400_000)} d ago`;
}

function isStale(iso: string | null | undefined): boolean {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > STALE_THRESHOLD_MS;
}

export interface DevicesTelemetryHealthProps {
  summary: DeviceSummaryOut | undefined;
  summaryLoading: boolean;
  /** When true, auto-refresh is paused. */
  pollingPaused?: boolean;
  onPollingToggle?: () => void;
}

export function DevicesTelemetryHealth({
  summary,
  summaryLoading,
  pollingPaused = false,
  onPollingToggle,
}: DevicesTelemetryHealthProps) {
  if (summaryLoading || !summary) return null;
  const lastUpdated = summary.telemetry_last_updated ?? null;
  const stale = isStale(lastUpdated);
  return (
    <div className="devices-telemetry-health" role="status" aria-live="polite">
      <span className="devices-telemetry-health-label">
        Telemetry: Last refresh {formatRelative(lastUpdated)}
      </span>
      {stale && (
        <span className="devices-telemetry-health-stale" role="alert">
          <AlertTriangle aria-hidden size={12} />
          Stale data (older than 5 min)
        </span>
      )}
      {onPollingToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onPollingToggle}
          aria-label={pollingPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
          title={pollingPaused ? "Resume refresh" : "Pause refresh"}
        >
          {pollingPaused ? <Play aria-hidden size={12} /> : <Pause aria-hidden size={12} />}
        </Button>
      )}
    </div>
  );
}
