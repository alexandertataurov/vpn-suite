import type { DeviceOut, DeviceTelemetryOut } from "@/shared/types/admin-api";

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatRate(bytesPerSec: number): string {
  if (bytesPerSec >= 1e6) return `${(bytesPerSec / 1e6).toFixed(2)} MB/s`;
  if (bytesPerSec >= 1e3) return `${(bytesPerSec / 1e3).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}

/** Recent handshake = tunnel considered up (seconds). */
const HANDSHAKE_RECENT_SEC = 120;
/** Any non-zero traffic = device considered "connected" (not idle). */
const TRAFFIC_CONNECTED_MIN_BYTES = 1;

export type ConnectionDisplay =
  | "Connected"
  | "Idle"
  | "Disconnected"
  | "Revoked"
  | "No telemetry"
  | "Node offline";

/**
 * Derives connection state from handshake recency + traffic.
 */
export function connectionStatus(d: DeviceOut): ConnectionDisplay {
  if (d.revoked_at) return "Revoked";
  const t = d.telemetry;
  if (!t) return "No telemetry";
  if (t.node_health === "offline") return "Node offline";
  if (!t.peer_present) return "Disconnected";

  const age = t.handshake_age_sec;
  const hasRecentHandshake = age != null && age <= HANDSHAKE_RECENT_SEC;
  if (!hasRecentHandshake) return "Disconnected";

  const rx = t.transfer_rx_bytes ?? 0;
  const tx = t.transfer_tx_bytes ?? 0;
  const totalBytes = rx + tx;
  return totalBytes >= TRAFFIC_CONNECTED_MIN_BYTES ? "Connected" : "Idle";
}

/** Handshake age in seconds; 0 when disconnected. */
export function formatHandshakeAge(d: DeviceOut): string {
  const conn = connectionStatus(d);
  if (conn === "Disconnected" || conn === "Revoked" || conn === "No telemetry" || conn === "Node offline")
    return "0";
  const age = d.telemetry?.handshake_age_sec;
  if (age != null) return `${age}`;
  return "0";
}

/**
 * Real RTT in ms from telemetry.
 */
export function formatLatencyMs(d: DeviceOut): string {
  const conn = connectionStatus(d);
  if (
    conn === "Disconnected" ||
    conn === "Revoked" ||
    conn === "No telemetry" ||
    conn === "Node offline"
  )
    return "Offline";
  const rtt = d.telemetry?.rtt_ms;
  if (rtt != null && rtt >= 0) return `${rtt}`;
  return "—";
}

export function deviceStatus(device: DeviceOut): string {
  if (device.revoked_at) return "revoked";
  if (device.suspended_at) return "suspended";
  return "active";
}

export type DeviceHealthVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface DeviceHealthInfo {
  label: string;
  variant: DeviceHealthVariant;
  detail?: string;
}

export function getDeviceConfigHealth(
  telemetry: DeviceTelemetryOut | null | undefined
): DeviceHealthInfo {
  if (!telemetry) {
    return {
      label: "No telemetry",
      variant: "info",
      detail: "No peer telemetry from node yet.",
    };
  }

  const {
    reconciliation_status: recon,
    node_health: nodeHealth,
    config_state: configState,
    telemetry_reason: reason,
  } = telemetry;

  if (recon === "broken") {
    return {
      label: "Config broken",
      variant: "danger",
      detail: reason || "Invalid allowed_ips or peer drift; rotate config and reconcile.",
    };
  }

  if (recon === "needs_reconcile") {
    let detail = reason;
    if (!detail) {
      if (nodeHealth === "offline") {
        detail = "Node offline; cannot reach peer.";
      } else {
        detail = "Config and peer state out of sync; run Reconcile.";
      }
    }
    return {
      label: "Needs reconcile",
      variant: "warning",
      detail,
    };
  }

  if (configState === "pending") {
    return {
      label: "Config pending",
      variant: "info",
      detail: "Config issued but not used yet.",
    };
  }

  return {
    label: "Healthy",
    variant: "success",
  };
}
