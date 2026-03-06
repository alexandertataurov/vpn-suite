import type { ReactNode } from "react";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApi } from "@/core/api/context";
import {
  AnimatedNumber,
  AnchorButton,
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  useToast,
  Widget,
} from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { KpiValue, MetaText } from "@/design-system/typography";

function normalizeConfigForQr(config: string): string {
  // Remove UTF-8 BOM if present, normalize newlines, and ensure no leading whitespace before [Interface]
  let s = config.replace(/^\uFEFF/, "");
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/^\s+(\[Interface\])/m, "$1");
  return s;
}

interface DeviceSummary {
  total: number;
  active: number;
  revoked: number;
  unused_configs: number;
  no_allowed_ips: number;
  handshake_ok_count: number;
  no_handshake_count: number;
  traffic_zero_count: number;
  telemetry_last_updated: string | null;
}

interface DeviceTelemetry {
  handshake_latest_at: string | null;
  handshake_age_sec?: number | null;
  transfer_rx_bytes: number | null;
  transfer_tx_bytes: number | null;
  rtt_ms?: number | null;
  node_health: string;
  peer_present?: boolean;
  reconciliation_status: string;
  config_state?: string;
  telemetry_reason?: string | null;
  last_updated?: string | null;
}

interface IssuedConfigOut {
  id: string;
  server_id: string;
  profile_type: string;
  expires_at: string | null;
  consumed_at: string | null;
  created_at: string;
}

interface DeviceListItem {
  id: string;
  user_id: number;
  subscription_id: string;
  server_id: string;
  device_name: string | null;
  user_email: string | null;
  issued_at: string;
  revoked_at: string | null;
  suspended_at: string | null;
  telemetry: DeviceTelemetry | null;
  issued_configs?: IssuedConfigOut[];
}

interface DeviceList {
  items: DeviceListItem[];
  total: number;
}

interface DeviceDetail extends DeviceListItem {
  issued_configs: IssuedConfigOut[];
  public_key?: string;
  allowed_ips?: string | null;
  apply_status?: string | null;
  last_applied_at?: string | null;
  last_error?: string | null;
}

interface ConfigEntryOut {
  download_url: string;
  qr_payload: string;
  amnezia_vpn_key?: string | null;
}

interface AdminRotatePeerResponse {
  config_awg: ConfigEntryOut;
  config_wg_obf: ConfigEntryOut;
  config_wg: ConfigEntryOut;
  request_id: string;
}

interface ConfigHealthDeviceEntry {
  device_id: string;
  server_id: string;
  user_email: string | null;
  device_name: string | null;
  status: string;
  reconciliation_status: string;
  config_state: string;
  reason: string | null;
  handshake_age_sec: number | null;
  peer_present: boolean;
  node_health: string;
}

interface ConfigHealthOut {
  by_reconciliation: Record<string, number>;
  no_telemetry_count: number;
  devices_needing_attention: ConfigHealthDeviceEntry[];
  telemetry_last_updated: string | null;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  return d.toLocaleDateString();
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec >= 1e6) return `${(bytesPerSec / 1e6).toFixed(2)} MB/s`;
  if (bytesPerSec >= 1e3) return `${(bytesPerSec / 1e3).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}

/** Recent handshake = tunnel considered up (seconds). */
const HANDSHAKE_RECENT_SEC = 120;
/** Any non-zero traffic = device considered "connected" (not idle). */
const TRAFFIC_CONNECTED_MIN_BYTES = 1;

type ConnectionDisplay = "Connected" | "Idle" | "Disconnected" | "Revoked" | "No telemetry" | "Node offline";

/**
 * Derives connection state from handshake recency + traffic.
 * - Connected: recent handshake + device has sent/received data (rx+tx > 0).
 * - Idle: recent handshake + no traffic (tunnel up, no flow yet).
 * - Disconnected: stale/no handshake, or node offline, or peer not on node.
 */
function connectionStatus(d: DeviceListItem): ConnectionDisplay {
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
function formatHandshakeAge(d: DeviceListItem): string {
  const conn = connectionStatus(d);
  if (conn === "Disconnected" || conn === "Revoked" || conn === "No telemetry" || conn === "Node offline") return "0";
  const age = d.telemetry?.handshake_age_sec;
  if (age != null) return `${age}`;
  return "0";
}

/** Real RTT in ms from telemetry.
 * - Connected/Idle and rtt_ms != null -> numeric string
 * - Connected/Idle and rtt_ms == null -> "—" (no measurement yet)
 * - Disconnected/Revoked/No telemetry/Node offline -> "Offline"
 */
function formatLatencyMs(d: DeviceListItem): string {
  const conn = connectionStatus(d);
  if (conn === "Disconnected" || conn === "Revoked" || conn === "No telemetry" || conn === "Node offline") return "Offline";
  const rtt = d.telemetry?.rtt_ms;
  if (rtt != null && rtt >= 0) return `${rtt}`;
  return "—";
}

function deviceStatus(device: DeviceListItem): string {
  if (device.revoked_at) return "revoked";
  if (device.suspended_at) return "suspended";
  return "active";
}

type DeviceHealthVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface DeviceHealthInfo {
  label: string;
  variant: DeviceHealthVariant;
  detail?: string;
}

function getDeviceConfigHealth(telemetry: DeviceTelemetry | null | undefined): DeviceHealthInfo {
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

export function DevicesPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [detailDeviceId, setDetailDeviceId] = useState<string | null>(null);
  const [revokeDeviceId, setRevokeDeviceId] = useState<string | null>(null);
  const [revokeToken, setRevokeToken] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [reissueResult, setReissueResult] = useState<AdminRotatePeerResponse | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState<string | null>(null);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useApiQuery<DeviceSummary>(["devices", "summary"], "/devices/summary", { retry: 1 });

  const prevListRef = useRef<DeviceList | null>(null);
  const prevListTsRef = useRef<number>(0);

  const {
    data: list,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useApiQuery<DeviceList>(["devices", "list", 50], "/devices?limit=50&offset=0", {
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const { data: detailDevice, isLoading: isDetailLoading } = useApiQuery<DeviceDetail>(
    ["devices", "detail", detailDeviceId],
    `/devices/${detailDeviceId!}`,
    { enabled: !!detailDeviceId, retry: 0 }
  );

  const {
    data: configHealth,
    isLoading: isConfigHealthLoading,
  } = useApiQuery<ConfigHealthOut>(
    ["devices", "config-health"],
    "/devices/config-health?limit=500",
    { retry: 1, staleTime: 60_000 }
  );

  const invalidateDevices = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["devices", "summary"] });
    void queryClient.invalidateQueries({ queryKey: ["devices", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["devices", "config-health"] });
    if (detailDeviceId) {
      void queryClient.invalidateQueries({ queryKey: ["devices", "detail", detailDeviceId] });
    }
  }, [queryClient, detailDeviceId]);

  const copyToClipboard = useCallback(
    async (value: string, successTitle: string) => {
      try {
        await navigator.clipboard.writeText(value);
        showToast({ variant: "success", title: successTitle });
      } catch (err) {
        showToast({
          variant: "warning",
          title: "Copy failed",
          description:
            err instanceof Error ? err.message : "Clipboard is unavailable in this browser.",
          persistent: true,
        });
      }
    },
    [showToast]
  );

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionError(null);
      setActionPending(true);
      try {
        await fn();
        invalidateDevices();
        void refetchList();
        void refetchSummary();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setActionPending(false);
      }
    },
    [invalidateDevices, refetchList, refetchSummary]
  );

  const handleReconcile = useCallback(
    async (id: string) => {
      setActionError(null);
      setActionPending(true);
      try {
        const res = await api.post<{ reconciled: boolean; message?: string }>(
          `/devices/${id}/reconcile`
        );
        showToast({
          variant: "success",
          title: "Reconcile queued",
          description: res.message ?? "Sync action queued for node-agent; try config download shortly.",
        });
        invalidateDevices();
        void refetchList();
        void refetchSummary();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Reconcile failed");
      } finally {
        setActionPending(false);
      }
    },
    [api, showToast, invalidateDevices, refetchList, refetchSummary]
  );

  const handleReconcileAll = useCallback(async () => {
    const serverIds = new Set<string>();
    for (const e of configHealth?.devices_needing_attention ?? []) serverIds.add(e.server_id);
    for (const d of list?.items ?? []) serverIds.add(d.server_id);
    const ids = Array.from(serverIds);
    if (ids.length === 0) {
      showToast({ variant: "warning", title: "No servers to reconcile" });
      return;
    }
    setActionError(null);
    setActionPending(true);
    try {
      for (const serverId of ids) {
        await api.post(`/servers/${serverId}/sync`, { mode: "full" });
      }
      showToast({
        variant: "success",
        title: "Reconcile all queued",
        description: `Full sync queued for ${ids.length} server(s).`,
      });
      invalidateDevices();
      void refetchList();
      void refetchSummary();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Reconcile all failed");
    } finally {
      setActionPending(false);
    }
  }, [api, configHealth, list, showToast, invalidateDevices, refetchList, refetchSummary]);

  const handleSuspend = useCallback(
    (id: string) => {
      runAction(() => api.post(`/devices/${id}/suspend`));
    },
    [api, runAction]
  );

  const handleResume = useCallback(
    (id: string) => {
      runAction(() => api.post(`/devices/${id}/resume`));
    },
    [api, runAction]
  );

  const handleRevokeSubmit = useCallback(async () => {
    if (!revokeDeviceId) return;
    await runAction(() =>
      api.post(`/devices/${revokeDeviceId}/revoke`, { confirm_token: revokeToken })
    );
    setRevokeDeviceId(null);
    setRevokeToken("");
    setDetailDeviceId(null);
  }, [api, revokeDeviceId, revokeToken, runAction]);

  const closeDetail = useCallback(() => {
    setDetailDeviceId(null);
    setActionError(null);
    setReissueResult(null);
  }, []);

  const downloadIssuedConfig = useCallback(
    async (issuedConfigId: string) => {
      setActionError(null);
      setActionPending(true);
      try {
        const res = await api.get<{ content: string }>(
          `/admin/configs/issued/${issuedConfigId}/content`
        );
        const blob = new Blob([res.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "client.conf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Download failed");
      } finally {
        setActionPending(false);
      }
    },
    [api]
  );

  const handleCopyIssuedConfig = useCallback(
    async (issuedConfigId: string) => {
      setActionError(null);
      setActionPending(true);
      try {
        const res = await api.get<{ content: string }>(
          `/admin/configs/issued/${issuedConfigId}/content`
        );
        await copyToClipboard(res.content, "Config copied to clipboard");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Copy failed";
        setActionError(msg);
        showToast({
          variant: "warning",
          title: "Copy failed",
          description: msg,
          persistent: true,
        });
      } finally {
        setActionPending(false);
      }
    },
    [api, copyToClipboard, showToast]
  );

  const handleShowIssuedConfigQr = useCallback(
    async (issuedConfigId: string) => {
      setActionError(null);
      setActionPending(true);
      try {
        const res = await api.get<{ content: string }>(
          `/admin/configs/issued/${issuedConfigId}/content`
        );
        setQrPayload(res.content);
        setQrTitle("Device config QR");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load config QR";
        setActionError(msg);
        showToast({
          variant: "warning",
          title: "QR unavailable",
          description: msg,
          persistent: true,
        });
      } finally {
        setActionPending(false);
      }
    },
    [api, showToast]
  );

  const handleReissue = useCallback(
    async (deviceId: string) => {
      setActionError(null);
      setReissueResult(null);
      setActionPending(true);
      try {
        const res = await api.post<AdminRotatePeerResponse>(`/devices/${deviceId}/reissue`);
        setReissueResult(res);
        invalidateDevices();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Reissue failed");
      } finally {
        setActionPending(false);
      }
    },
    [api, invalidateDevices]
  );

  const ratesMap = useMemo(() => {
    const prev = prevListRef.current;
    const prevTs = prevListTsRef.current;
    if (!list?.items?.length || !prev?.items?.length || prevTs <= 0) return new Map<string, { rx: number; tx: number }>();
    const intervalSec = (Date.now() - prevTs) / 1000;
    if (intervalSec < 1) return new Map<string, { rx: number; tx: number }>();
    const prevBy = new Map(prev.items.map((i) => [i.id, i]));
    const out = new Map<string, { rx: number; tx: number }>();
    for (const d of list.items) {
      const p = prevBy.get(d.id);
      if (!p?.telemetry || !d.telemetry) continue;
      const rxPrev = p.telemetry.transfer_rx_bytes ?? 0;
      const txPrev = p.telemetry.transfer_tx_bytes ?? 0;
      const rxCur = d.telemetry.transfer_rx_bytes ?? 0;
      const txCur = d.telemetry.transfer_tx_bytes ?? 0;
      out.set(d.id, {
        rx: Math.max(0, (rxCur - rxPrev) / intervalSec),
        tx: Math.max(0, (txCur - txPrev) / intervalSec),
      });
    }
    return out;
  }, [list]);

  useEffect(() => {
    if (list?.items?.length) {
      prevListRef.current = list;
      prevListTsRef.current = Date.now();
    }
  }, [list]);

  if (isSummaryLoading || isListLoading) {
    return (
      <PageLayout title="Devices" pageClass="devices-page" hideHeader>
        <Skeleton height={32} width="30%" />
        <Skeleton height={160} />
      </PageLayout>
    );
  }

  if (isSummaryError || isListError) {
    const message =
      summaryError instanceof Error
        ? summaryError.message
        : listError instanceof Error
          ? listError.message
          : "Failed to load devices";
    return (
      <PageLayout title="Devices" pageClass="devices-page" hideHeader>
        <ErrorState
          message={message}
          onRetry={() => {
            void refetchSummary();
            void refetchList();
          }}
        />
      </PageLayout>
    );
  }

  if (!summary || !list) {
    return (
      <PageLayout title="Devices" pageClass="devices-page">
        <EmptyState message="No devices yet." />
      </PageLayout>
    );
  }

  const unhealthy = summary.no_handshake_count;
  const healthy = summary.handshake_ok_count;
  const telemetryNone = summary.traffic_zero_count;
  const activePercent =
    summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0;
  const handshakeHealthyPercent =
    summary.active > 0 ? Math.round((healthy / summary.active) * 100) : null;
  const attentionCount =
    summary.no_handshake_count + summary.no_allowed_ips + summary.traffic_zero_count;

  const rows = list.items.map((d) => {
    const rxBytes = d.telemetry?.transfer_rx_bytes ?? null;
    const txBytes = d.telemetry?.transfer_tx_bytes ?? null;
    const totalBytes =
      rxBytes == null && txBytes == null ? null : (rxBytes ?? 0) + (txBytes ?? 0);
    const rates = ratesMap.get(d.id);
    const liveBandwidth =
      rates != null
        ? `${formatRate(rates.rx)} ↓ ${formatRate(rates.tx)} ↑`
        : formatBytes(totalBytes);

    const conn = connectionStatus(d);
    const connectionVariant: DeviceHealthVariant =
      conn === "Connected" ? "success"
      : conn === "Idle" ? "info"
      : conn === "Node offline" || conn === "Revoked" ? "danger"
      : conn === "Disconnected" ? "warning"
      : "neutral";

    const rawRtt = conn === "Connected" || conn === "Idle" ? d.telemetry?.rtt_ms ?? null : null;
    let latencyCell: ReactNode;
    if (rawRtt != null && rawRtt >= 0) {
      const latencyVariant: DeviceHealthVariant =
        rawRtt < 40 ? "success" : rawRtt <= 80 ? "warning" : "danger";
      latencyCell = (
        <Badge variant={latencyVariant} size="sm">
          {rawRtt}
        </Badge>
      );
    } else {
      const label = formatLatencyMs(d);
      latencyCell = label;
    }
    return {
      id: d.id,
      name: d.device_name || "(unnamed)",
      user: d.user_email || `#${d.user_id}`,
      server: d.server_id,
      status: deviceStatus(d),
      connection: <Badge variant={connectionVariant} size="sm">{conn}</Badge>,
      handshakeAge: formatHandshakeAge(d),
      latencyMs: latencyCell,
      lastHandshake: d.telemetry?.handshake_latest_at
        ? formatRelative(d.telemetry.handshake_latest_at)
        : "—",
      rx: formatBytes(rxBytes),
      tx: formatBytes(txBytes),
      bandwidth: liveBandwidth,
      actions: (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setDetailDeviceId(d.id)}
          aria-label={`View ${d.device_name || d.id}`}
        >
          View
        </Button>
      ),
    };
  });

  const detailHealth = detailDevice ? getDeviceConfigHealth(detailDevice.telemetry) : null;

  const devicesDescription = (
    <span className="devices-page__updated">
      Telemetry updated {formatRelative(summary.telemetry_last_updated)}
    </span>
  );
  const devicesActions = (
    <Button
      type="button"
      variant="default"
      onClick={() => {
        if (list.items.length > 0) {
          const first = list.items[0];
          const subId = first?.subscription_id;
          const hint = subId ? `Example subscription: ${subId}` : undefined;
          window.alert(
            [
              "To add a new device, go to the Users page, open a user, and use the 'Issue device' panel.",
              hint,
            ]
              .filter(Boolean)
              .join("\n\n")
          );
        } else {
          window.alert(
            "To add a new device, go to the Users page, open a user, and use the 'Issue device' panel."
          );
        }
      }}
    >
      Add device
    </Button>
  );

  return (
    <PageLayout
      title="Devices"
      description={devicesDescription}
      actions={devicesActions}
      pageClass="devices-page"
    >
      <SectionHeader label="Summary" size="lg" />
      <div className="kpi-grid devices-page__cards">
        <Widget title="Total devices" subtitle="inventory" variant="kpi" href="/devices" size="medium">
          <KpiValue as="div" className="kpi__value">
            <AnimatedNumber value={summary.total} />
          </KpiValue>
          <div className="kpi__meta">
            <span className="kpi__meta-item">{summary.active} active</span>
            <span className="kpi__meta-item">{summary.revoked} revoked</span>
          </div>
        </Widget>
        <Widget title="Active share" subtitle="fleet" variant="kpi" size="medium">
          <KpiValue as="div" className="kpi__value">
            <AnimatedNumber value={activePercent} decimals={1} />%
          </KpiValue>
          <div className="kpi__meta">
            <span className="kpi__meta-item">
              {summary.active}/{summary.total} active
            </span>
          </div>
        </Widget>
        <Widget title="Handshake health" subtitle="recent handshake" variant="kpi" size="medium">
          <KpiValue as="div" className="kpi__value">
            <AnimatedNumber value={healthy} />
          </KpiValue>
          <div className="kpi__meta">
            <span className="kpi__meta-item">{unhealthy} without recent handshake</span>
            {handshakeHealthyPercent !== null && (
              <span className="kpi__meta-item">
                {handshakeHealthyPercent}% of active with fresh handshake
              </span>
            )}
          </div>
        </Widget>
        <Widget title="Traffic" subtitle="recent" variant="kpi" size="medium">
          <KpiValue as="div" className="kpi__value">
            <AnimatedNumber value={telemetryNone} />
          </KpiValue>
          <div className="kpi__meta">
            <span className="kpi__meta-item">zero traffic devices</span>
          </div>
        </Widget>
        <Widget title="Config quality" subtitle="configs" variant="kpi" size="medium">
          <KpiValue as="div" className="kpi__value">
            <AnimatedNumber value={summary.unused_configs} />
          </KpiValue>
          <div className="kpi__meta">
            <span className="kpi__meta-item">unused configs</span>
            <span className="kpi__meta-item">{summary.no_allowed_ips} invalid allowed_ips</span>
          </div>
        </Widget>
        <Widget
          title="Needs attention"
          subtitle="config / telemetry"
          variant="kpi"
          href="/devices"
          size="medium"
        >
          <KpiValue as="div" className="kpi__value">
            <AnimatedNumber value={attentionCount} />
          </KpiValue>
          <div className="kpi__meta">
            <span className="kpi__meta-item">
              {summary.no_handshake_count} with no recent handshake
            </span>
            <span className="kpi__meta-item">
              {telemetryNone} with zero traffic
            </span>
            <span className="kpi__meta-item">
              {summary.no_allowed_ips} with invalid config
            </span>
          </div>
        </Widget>
      </div>

      <section className="devices-page__config-health" aria-label="Advanced config health">
        <h3 className="devices-page__detail-h3">Config health</h3>
        {isConfigHealthLoading && <Skeleton height={120} />}
        {!isConfigHealthLoading && configHealth && (
          <div className="devices-page__config-health-content">
            <div className="devices-page__config-health-summary">
              <span className="badge badge-sm badge-success">
                {configHealth.by_reconciliation?.ok ?? 0} ok
              </span>
              <span className="badge badge-sm badge-warning">
                {configHealth.by_reconciliation?.needs_reconcile ?? 0} needs reconcile
              </span>
              <span className="badge badge-sm badge-danger">
                {configHealth.by_reconciliation?.broken ?? 0} broken
              </span>
              <span className="badge badge-sm badge-neutral">
                {configHealth.no_telemetry_count} no telemetry
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReconcileAll}
                disabled={actionPending}
                aria-label="Hard reconcile all configs from server"
              >
                Reconcile all
              </Button>
              {configHealth.telemetry_last_updated && (
                <MetaText className="devices-page__config-health-meta">
                  Telemetry: {formatRelative(configHealth.telemetry_last_updated)}
                </MetaText>
              )}
            </div>
            {configHealth.devices_needing_attention.length > 0 ? (
              <div className="data-table-wrap">
              <DataTable
                density="compact"
                columns={[
                  { key: "device", header: "Device" },
                  { key: "user", header: "User" },
                  { key: "server", header: "Server" },
                  { key: "recon", header: "Status" },
                  { key: "reason", header: "Reason" },
                  { key: "view", header: "" },
                ]}
                rows={configHealth.devices_needing_attention.map((e) => ({
                  ...e,
                  device: e.device_name || e.device_id.slice(0, 8),
                  user: e.user_email ?? "—",
                  recon: (
                    <Badge
                      variant={e.reconciliation_status === "broken" ? "danger" : "warning"}
                      size="sm"
                    >
                      {e.reconciliation_status}
                    </Badge>
                  ),
                  reason: e.reason ?? "—",
                  view: (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailDeviceId(e.device_id)}
                      aria-label={`View ${e.device_id}`}
                    >
                      View
                    </Button>
                  ),
                }))}
                getRowKey={(row: { device_id: string }) => row.device_id}
              />
              </div>
            ) : (
              <MetaText>No devices need attention.</MetaText>
            )}
          </div>
        )}
      </section>

      {rows.length > 0 ? (
        <section className="devices-page__table" aria-label="Devices list">
          <SectionHeader label="Devices" size="lg" />
          <div className="data-table-wrap">
          <DataTable
            density="compact"
            columns={[
              { key: "name", header: "Device" },
              { key: "user", header: "User" },
              { key: "server", header: "Server" },
              { key: "status", header: "Status" },
              { key: "connection", header: "Connection" },
              { key: "handshakeAge", header: "Handshake age (s)", title: "Seconds since last handshake; 0 when disconnected." },
              { key: "latencyMs", header: "Latency (ms)", title: "Round-trip time (ms) from node; value when measured, \"—\" when not yet measured, Offline when disconnected." },
              { key: "lastHandshake", header: "Last handshake" },
              { key: "rx", header: "RX" },
              { key: "tx", header: "TX" },
              { key: "bandwidth", header: "Live bandwidth" },
              { key: "actions", header: "Actions" },
            ]}
            rows={rows}
            getRowKey={(row: { id: string }) => row.id}
          />
          </div>
        </section>
      ) : (
        <EmptyState message="No devices found for current filters." />
      )}

      <Modal open={!!detailDeviceId} onClose={closeDetail} title="Device details">
        {detailDeviceId && (
          <div className="devices-page__detail">
            {isDetailLoading && <Skeleton height={80} />}
            {!isDetailLoading && detailDevice && (
              <>
                <dl className="devices-page__detail-dl">
                  <dt>Device</dt>
                  <dd>{detailDevice.device_name || detailDevice.id}</dd>
                  <dt>ID</dt>
                  <dd className="devices-page__detail-id">{detailDevice.id}</dd>
                  <dt>User</dt>
                  <dd>{detailDevice.user_email ?? `#${detailDevice.user_id}`}</dd>
                  <dt>Server</dt>
                  <dd>{detailDevice.server_id}</dd>
                  <dt>Status</dt>
                  <dd>{deviceStatus(detailDevice)}</dd>
                  {detailHealth && (
                    <>
                      <dt>Health</dt>
                      <dd>
                        <Badge
                          variant={detailHealth.variant}
                          size="sm"
                        >
                          {detailHealth.label}
                        </Badge>
                        {detailHealth.detail && (
                          <span className="devices-page__detail-health-meta">
                            {detailHealth.detail}
                          </span>
                        )}
                      </dd>
                    </>
                  )}
                  {detailDevice.apply_status && (
                    <>
                      <dt>Apply status</dt>
                      <dd>{detailDevice.apply_status}</dd>
                    </>
                  )}
                  {detailDevice.last_error && (
                    <>
                      <dt>Last error</dt>
                      <dd className="devices-page__detail-error">{detailDevice.last_error}</dd>
                    </>
                  )}
                </dl>
                <div className="devices-page__detail-buttons" aria-label="Device config actions">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => handleReissue(detailDevice.id)}
                    disabled={actionPending}
                  >
                    Rotate config
                  </Button>
                  {reissueResult && (
                    <>
                      <AnchorButton
                        href={reissueResult.config_awg.download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download AWG
                      </AnchorButton>
                      <AnchorButton
                        href={reissueResult.config_wg_obf.download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download WG (obf)
                      </AnchorButton>
                      <AnchorButton
                        href={reissueResult.config_wg.download_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download WG
                      </AnchorButton>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          void copyToClipboard(
                            reissueResult.config_awg.qr_payload,
                            "AWG config copied"
                          );
                        }}
                        disabled={actionPending}
                      >
                        Copy AWG
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          void copyToClipboard(
                            reissueResult.config_wg_obf.qr_payload,
                            "WG (obf) config copied"
                          );
                        }}
                        disabled={actionPending}
                      >
                        Copy WG (obf)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          void copyToClipboard(
                            reissueResult.config_wg.qr_payload,
                            "WG config copied"
                          );
                        }}
                        disabled={actionPending}
                      >
                        Copy WG
                      </Button>
                      {reissueResult.config_awg.amnezia_vpn_key && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setQrPayload(reissueResult.config_awg.amnezia_vpn_key!);
                            setQrTitle("AmneziaVPN QR (vpn:// key)");
                          }}
                          disabled={actionPending}
                        >
                          AmneziaVPN QR
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            const res = await api.get<{ url: string; expires_in: number }>(
                              `/api/v1/devices/${detailDevice.id}/awg/download-link`,
                            );
                            setQrPayload(res.url);
                            setQrTitle("AmneziaWG QR (download .conf)");
                          } catch {
                            showToast({
                              variant: "danger",
                              title: "Failed to create download link",
                            });
                          }
                        }}
                        disabled={actionPending}
                      >
                        AmneziaWG QR (download link)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setQrPayload(reissueResult.config_awg.qr_payload);
                          setQrTitle("AmneziaWG QR (legacy .conf)");
                        }}
                        disabled={actionPending}
                      >
                        AmneziaWG QR (legacy .conf)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setQrPayload(reissueResult.config_wg_obf.qr_payload);
                          setQrTitle("WG (obf) config QR");
                        }}
                        disabled={actionPending}
                      >
                        WG (obf) QR
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setQrPayload(reissueResult.config_wg.qr_payload);
                          setQrTitle("WG config QR");
                        }}
                        disabled={actionPending}
                      >
                        WG QR
                      </Button>
                    </>
                  )}
                </div>
                {reissueResult && (
                  <p className="devices-page__detail-empty">Reissued (request_id: {reissueResult.request_id})</p>
                )}
                <h3 className="devices-page__detail-h3">Configurations</h3>
                {detailDevice.issued_configs && detailDevice.issued_configs.length > 0 ? (
                  <div className="data-table-wrap">
                  <DataTable
                    density="compact"
                    columns={[
                      { key: "profile_type", header: "Profile" },
                      { key: "server_id", header: "Server" },
                      { key: "created_at", header: "Created" },
                      { key: "consumed_at", header: "Consumed" },
                      { key: "download", header: "Download" },
                    ]}
                    rows={detailDevice.issued_configs.map((c) => ({
                      ...c,
                      created_at: c.created_at ? formatRelative(c.created_at) : "—",
                      consumed_at: c.consumed_at ? formatRelative(c.consumed_at) : "—",
                      download: (
                        <div className="devices-page__config-actions">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadIssuedConfig(c.id)}
                            disabled={actionPending}
                          >
                            Download
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void handleCopyIssuedConfig(c.id);
                            }}
                            disabled={actionPending}
                          >
                            Copy
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void handleShowIssuedConfigQr(c.id);
                            }}
                            disabled={actionPending}
                          >
                            QR
                          </Button>
                        </div>
                      ),
                    }))}
                    getRowKey={(row: { id: string }) => row.id}
                  />
                  </div>
                ) : (
                  <p className="devices-page__detail-empty">No issued configs.</p>
                )}
                <div className="devices-page__detail-actions">
                  {actionError && (
                    <p className="devices-page__detail-action-error" role="alert">
                      {actionError}
                    </p>
                  )}
                  <div className="devices-page__detail-buttons">
                    {deviceStatus(detailDevice) === "active" && (
                      <>
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => handleReconcile(detailDevice.id)}
                          disabled={actionPending}
                        >
                          Reconcile
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => handleSuspend(detailDevice.id)}
                          disabled={actionPending}
                        >
                          Suspend
                        </Button>
                      </>
                    )}
                    {deviceStatus(detailDevice) === "suspended" && (
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => handleResume(detailDevice.id)}
                        disabled={actionPending}
                      >
                        Resume
                      </Button>
                    )}
                    {!detailDevice.revoked_at && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                          setRevokeDeviceId(detailDevice.id);
                        }}
                        disabled={actionPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!revokeDeviceId}
        onClose={() => {
          setRevokeDeviceId(null);
          setRevokeToken("");
        }}
        title="Revoke device"
      >
        <p className="devices-page__revoke-hint">Enter the confirmation token to revoke this device.</p>
        <label className="devices-page__revoke-label">
          Confirm token
          <Input
            type="password"
            value={revokeToken}
            onChange={(e) => setRevokeToken(e.target.value)}
            placeholder="Token"
            aria-label="Revoke confirmation token"
          />
        </label>
        <div className="devices-page__revoke-actions">
          <Button
            type="button"
            variant="default"
            onClick={() => {
              setRevokeDeviceId(null);
              setRevokeToken("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleRevokeSubmit}
            disabled={!revokeToken.trim() || actionPending}
          >
            Revoke
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!qrPayload}
        onClose={() => {
          setQrPayload(null);
          setQrTitle(null);
        }}
        title={qrTitle || "Config QR"}
      >
        {qrPayload && (
          <div className="devices-page__qr">
            <QRCodeSVG
              value={normalizeConfigForQr(qrPayload)}
              size={300}
              level="L"
              includeMargin
            />
            <div className="devices-page__qr-actions">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  void copyToClipboard(qrPayload, "Config copied to clipboard");
                }}
                disabled={actionPending}
              >
                Copy config
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
