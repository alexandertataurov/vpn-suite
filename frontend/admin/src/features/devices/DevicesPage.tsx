import type { ReactNode } from "react";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApi } from "@/core/api/context";
import { deviceKeys, type DeviceListParams } from "@/features/devices/services/device.query-keys";
import {
  formatBytes,
  formatRate,
  formatRelative,
  connectionStatus,
  formatHandshakeAge,
  formatLatencyMs,
  deviceStatus,
  type DeviceHealthVariant,
} from "@/features/devices/utils/deviceFormatting";
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LinkButton,
  Modal,
  Pagination,
  SectionHeader,
  Skeleton,
  useToast,
  Widget,
} from "@/design-system/primitives";
import { PageLayout } from "@/layout/PageLayout";
import { KpiValue, MetaText } from "@/design-system/typography";
import type { DeviceList, DeviceOut, DeviceSummaryOut } from "@/shared/types/admin-api";
import { ConfigQrModal } from "@/features/devices/ConfigQrModal";
import { DeviceDetailModal } from "@/features/devices/DeviceDetailModal";
import { RevokeDeviceModal } from "@/features/devices/RevokeDeviceModal";

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
  const [addDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
  const [listParams, setListParams] = useState<DeviceListParams>({
    limit: 50,
    offset: 0,
    status: null,
    node_id: null,
  });

  const devicesListUrl = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(listParams.limit));
    sp.set("offset", String(listParams.offset));
    if (listParams.status) sp.set("status", listParams.status);
    if (listParams.node_id) sp.set("node_id", listParams.node_id);
    return `/devices?${sp.toString()}`;
  }, [listParams]);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useApiQuery<DeviceSummaryOut>([...deviceKeys.summary()], "/devices/summary", { retry: 1 });

  const prevListRef = useRef<DeviceList | null>(null);
  const prevListTsRef = useRef<number>(0);

  const {
    data: list,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useApiQuery<DeviceList>([...deviceKeys.list(listParams)], devicesListUrl, {
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const { data: detailDevice, isLoading: isDetailLoading } = useApiQuery<DeviceOut>(
    [...deviceKeys.detail(detailDeviceId ?? "")],
    `/devices/${detailDeviceId!}`,
    { enabled: !!detailDeviceId, retry: 0 }
  );

  const {
    data: configHealth,
    isLoading: isConfigHealthLoading,
  } = useApiQuery<ConfigHealthOut>(
    [...deviceKeys.configHealth()],
    "/devices/config-health?limit=500",
    { retry: 1, staleTime: 60_000 }
  );

  const invalidateDevices = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...deviceKeys.summary()] });
    void queryClient.invalidateQueries({ queryKey: [...deviceKeys.lists()] });
    void queryClient.invalidateQueries({ queryKey: [...deviceKeys.configHealth()] });
    if (detailDeviceId) {
      void queryClient.invalidateQueries({ queryKey: [...deviceKeys.detail(detailDeviceId)] });
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
        const msg = e instanceof Error ? e.message : "Action failed";
        setActionError(msg);
        showToast({ variant: "danger", title: "Action failed", description: msg });
      } finally {
        setActionPending(false);
      }
    },
    [invalidateDevices, refetchList, refetchSummary, showToast]
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
        const msg = e instanceof Error ? e.message : "Reconcile failed";
        setActionError(msg);
        showToast({ variant: "danger", title: "Reconcile failed", description: msg });
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
      const msg = e instanceof Error ? e.message : "Reconcile all failed";
      setActionError(msg);
      showToast({ variant: "danger", title: "Reconcile all failed", description: msg });
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

  const handleAwgDownloadLinkQr = useCallback(
    async (deviceId: string) => {
      try {
        const res = await api.get<{ url: string; expires_in: number }>(
          `/api/v1/devices/${deviceId}/awg/download-link`
        );
        setQrPayload(res.url);
        setQrTitle("AmneziaWG QR (download .conf)");
      } catch {
        showToast({ variant: "danger", title: "Failed to create download link" });
      }
    },
    [api, showToast]
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

  const unhealthy = summary.no_handshake_count ?? 0;
  const healthy = summary.handshake_ok_count ?? 0;
  const telemetryNone = summary.traffic_zero_count ?? 0;
  const activePercent =
    summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0;
  const handshakeHealthyPercent =
    summary.active > 0 ? Math.round((healthy / summary.active) * 100) : null;
  const attentionCount =
    (summary.no_handshake_count ?? 0) +
    (summary.no_allowed_ips ?? 0) +
    (summary.traffic_zero_count ?? 0);

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

  const devicesDescription = (
    <span className="devices-page__updated">
      Telemetry updated {formatRelative(summary.telemetry_last_updated ?? null)}
    </span>
  );
  const devicesActions = (
    <Button type="button" variant="default" onClick={() => setAddDeviceModalOpen(true)}>
      Add device
    </Button>
  );
  const addDeviceHint =
    list.items.length > 0
      ? `Example subscription: ${list.items[0]?.subscription_id ?? ""}`
      : null;

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
              {unhealthy} with no recent handshake
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

      <SectionHeader
        label="Config health"
        size="lg"
        note={
          configHealth?.telemetry_last_updated
            ? `Telemetry: ${formatRelative(configHealth.telemetry_last_updated)}`
            : undefined
        }
      />
      <Card>
        {isConfigHealthLoading && <Skeleton height={120} />}
        {!isConfigHealthLoading && configHealth && (
          <div className="devices-page__config-health-content">
            <div className="devices-page__config-health-summary">
              <Badge variant="success" size="sm">
                {configHealth.by_reconciliation?.ok ?? 0} ok
              </Badge>
              <Badge variant="warning" size="sm">
                {configHealth.by_reconciliation?.needs_reconcile ?? 0} needs reconcile
              </Badge>
              <Badge variant="danger" size="sm">
                {configHealth.by_reconciliation?.broken ?? 0} broken
              </Badge>
              <Badge variant="neutral" size="sm">
                {configHealth.no_telemetry_count} no telemetry
              </Badge>
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
      </Card>

      <section className="devices-page__table" aria-label="Devices list">
        <SectionHeader label="Devices" size="lg" />
        <div className="devices-page__filters">
          <label className="devices-page__filter-label">
            Status
            <select
              value={listParams.status ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setListParams((p) => ({
                  ...p,
                  offset: 0,
                  status: v ? v : null,
                }));
              }}
              aria-label="Filter by status"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>
          <label className="devices-page__filter-label">
            Server (node ID)
            <Input
              type="text"
              value={listParams.node_id ?? ""}
              onChange={(e) =>
                setListParams((p) => ({
                  ...p,
                  offset: 0,
                  node_id: e.target.value.trim() || null,
                }))
              }
              placeholder="e.g. node-1"
              aria-label="Filter by server node ID"
            />
          </label>
        </div>
        {rows.length > 0 ? (
          <>
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
          <div className="devices-page__pagination-wrap">
            <Pagination
              page={Math.floor(list.offset / list.limit) + 1}
              pageCount={Math.max(1, Math.ceil(list.total / list.limit))}
              onPageChange={(page) =>
                setListParams((p) => ({ ...p, offset: (page - 1) * p.limit }))
              }
            />
            <MetaText className="devices-page__pagination-meta">
              {list.total} device{list.total !== 1 ? "s" : ""}
            </MetaText>
          </div>
          </>
        ) : (
          <EmptyState message="No devices found for current filters." />
        )}
      </section>

      <DeviceDetailModal
        open={!!detailDeviceId}
        onClose={closeDetail}
        deviceId={detailDeviceId}
        device={detailDevice}
        isLoading={isDetailLoading}
        actionError={actionError}
        actionPending={actionPending}
        reissueResult={reissueResult}
        onReissue={handleReissue}
        onReconcile={handleReconcile}
        onSuspend={handleSuspend}
        onResume={handleResume}
        onRevokeClick={setRevokeDeviceId}
        onCopyToClipboard={copyToClipboard}
        onSetQr={(payload, title) => {
          setQrPayload(payload);
          setQrTitle(title);
        }}
        onDownloadIssuedConfig={downloadIssuedConfig}
        onCopyIssuedConfig={handleCopyIssuedConfig}
        onShowIssuedConfigQr={handleShowIssuedConfigQr}
        onAwgDownloadLinkQr={handleAwgDownloadLinkQr}
        showToast={showToast}
      />

      <Modal
        open={addDeviceModalOpen}
        onClose={() => setAddDeviceModalOpen(false)}
        title="Add device"
      >
        <p className="devices-page__revoke-hint">
          To add a new device, go to the Users page, open a user, and use the &quot;Issue device&quot; panel.
        </p>
        {addDeviceHint ? (
          <MetaText className="devices-page__config-health-meta">{addDeviceHint}</MetaText>
        ) : null}
        <div className="devices-page__revoke-actions">
          <LinkButton to="/users" variant="default">
            Open Users
          </LinkButton>
          <Button type="button" variant="secondary" onClick={() => setAddDeviceModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      <RevokeDeviceModal
        open={!!revokeDeviceId}
        onClose={() => {
          setRevokeDeviceId(null);
          setRevokeToken("");
        }}
        revokeToken={revokeToken}
        onRevokeTokenChange={setRevokeToken}
        onConfirm={handleRevokeSubmit}
        pending={actionPending}
      />

      <ConfigQrModal
        open={!!qrPayload}
        onClose={() => {
          setQrPayload(null);
          setQrTitle(null);
        }}
        title={qrTitle}
        payload={qrPayload}
        onCopy={() => void copyToClipboard(qrPayload ?? "", "Config copied to clipboard")}
        pending={actionPending}
      />
    </PageLayout>
  );
}
