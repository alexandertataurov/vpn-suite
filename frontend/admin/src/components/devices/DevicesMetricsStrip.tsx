import { IconWarning } from "@/design-system/icons";
import type { DeviceSummaryOut } from "@vpn-suite/shared/types";

export type DevicesQuickFilter = "handshake_ok" | "no_handshake" | "traffic_zero" | "no_allowed_ips" | null;

export interface DevicesMetricsStripProps {
  summary: DeviceSummaryOut | undefined;
  summaryLoading: boolean;
  /** When set, parent filters list by this metric. */
  quickFilter: DevicesQuickFilter | null;
  onQuickFilterChange: (filter: DevicesQuickFilter) => void;
}

export function DevicesMetricsStrip({
  summary,
  summaryLoading,
  quickFilter,
  onQuickFilterChange,
}: DevicesMetricsStripProps) {
  if (summaryLoading || !summary) {
    return (
      <div className="devices-metrics-strip" role="region" aria-label="Devices summary">
        <span className="devices-metrics-strip-loading">Loading…</span>
      </div>
    );
  }
  const handshakeOk = summary.handshake_ok_count ?? 0;
  const noHandshake = summary.no_handshake_count ?? 0;
  const trafficZero = summary.traffic_zero_count ?? 0;
  const btn = (label: string, count: number, filter: DevicesQuickFilter, warn?: boolean) => (
    <button
      type="button"
      className={`devices-metrics-strip-item ${quickFilter === filter ? "devices-metrics-strip-item-active" : ""} ${warn ? "devices-metrics-strip-warn" : ""}`}
      onClick={() => onQuickFilterChange(quickFilter === filter ? null : filter)}
      aria-pressed={quickFilter === filter}
    >
      {warn ? <IconWarning aria-hidden size={12} strokeWidth={1.5} /> : null}
      {label}: <strong>{count}</strong>
    </button>
  );
  return (
    <div className="devices-metrics-strip" role="region" aria-label="Devices summary">
      <span className="devices-metrics-strip-item">
        Total: <strong>{summary.total}</strong>
      </span>
      <span className="devices-metrics-strip-item">
        Active: <strong>{summary.active}</strong>
      </span>
      <span className="devices-metrics-strip-item">
        Revoked: <strong>{summary.revoked}</strong>
      </span>
      {btn("Handshake OK", handshakeOk, "handshake_ok")}
      {btn("No handshake", noHandshake, "no_handshake")}
      {btn("Traffic 0", trafficZero, "traffic_zero")}
      {summary.no_allowed_ips > 0 ? btn("AllowedIPs missing", summary.no_allowed_ips, "no_allowed_ips", true) : null}
      <span className="devices-metrics-strip-item">
        Pending configs: <strong>{summary.unused_configs}</strong>
      </span>
    </div>
  );
}
