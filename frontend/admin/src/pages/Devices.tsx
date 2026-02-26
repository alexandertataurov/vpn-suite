import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MoreVertical, RefreshCw, Smartphone } from "lucide-react";
import { PrimitiveBadge, Table, VirtualTable, Select, Button, Checkbox, DeviceCard, ConfirmDanger, ConfirmModal, useToast, PageError, HelperText, DropdownMenu } from "@vpn-suite/shared/ui";
import { formatDate, getErrorMessage } from "@vpn-suite/shared";
import { ConfigContentModal } from "../components/ConfigContentModal";
import { ReissueConfigModal } from "../components/ReissueConfigModal";
import { PageHeader } from "../components/PageHeader";
import { TableSection } from "../components/TableSection";
import { DevicesControlBar } from "../components/devices/DevicesControlBar";
import { DeviceDetailDrawer } from "../components/devices/DeviceDetailDrawer";
import { DevicesMetricsStrip, type DevicesQuickFilter } from "../components/devices/DevicesMetricsStrip";
import { DevicesTelemetryHealth } from "../components/devices/DevicesTelemetryHealth";
import { DevicesBulkPanel } from "../components/devices/DevicesBulkPanel";
import type { AdminRotatePeerResponse, AppSettingsOut, DeviceOut, DeviceList, DeviceSummaryOut, IssuedConfigOut } from "@vpn-suite/shared/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { APP_SETTINGS_KEY, DEVICES_KEY, DEVICES_SUMMARY_KEY } from "../api/query-keys";
import { useServerListForRegion, useServerListFull } from "../hooks/useServerList";
import {
  loadSavedViews,
  removeSavedView,
  type SavedView,
  upsertSavedView,
} from "../utils/savedViews";

const SEARCH_DEBOUNCE_MS = 300;
const SORT_OPTIONS = [
  { value: "issued_at_desc", label: "Newest first" },
  { value: "issued_at_asc", label: "Oldest first" },
  { value: "user", label: "User" },
  { value: "node", label: "Node" },
  { value: "status", label: "Status" },
] as const;

const LIMIT = 20;
const DEVICES_POLL_INTERVAL_MS = 90_000;
const DEVICES_VIEWS_SCOPE = "devices";
type ViewMode = "cards" | "table";
type ViewPreset = "needs_attention" | "pending_issuance" | "recently_active" | null;

function configLabel(c: IssuedConfigOut): string {
  const status = c.consumed_at ? "used" : "pending";
  const date = c.created_at ? formatDate(c.created_at) : "";
  return `${c.profile_type} • ${status} • ${date}`;
}

function profileShortName(profileType: string): string {
  const s = profileType.toUpperCase();
  if (s.includes("AMNEZIA") || s === "AWG") return "AWG";
  if (s.includes("OBF")) return "WG-OBF";
  return "WG";
}

/** Compact config chips: label + colored dot only (green=used, amber=unused, gray=none). */
function ConfigChipsCell({
  configs,
  onShow,
}: {
  configs: IssuedConfigOut[];
  onShow: (id: string, label: string) => void;
}) {
  if (!configs.length) return "—";
  return (
    <span className="ref-configs-chips" role="list">
      {configs.map((c) => {
        const dotClass = c.consumed_at
          ? "ref-config-dot-used"
          : "ref-config-dot-pending";
        return (
          <button
            key={c.id}
            type="button"
            className="ref-config-chip"
            onClick={() => onShow(c.id, configLabel(c))}
            title={configLabel(c)}
          >
            <span className={`ref-config-dot ${dotClass}`} aria-hidden />
            {profileShortName(c.profile_type)}
          </button>
        );
      })}
    </span>
  );
}

function formatHandshakeAge(ageSec: number | null | undefined): string {
  if (ageSec == null) return "—";
  if (ageSec < 60) return `${ageSec}s`;
  if (ageSec < 3600) return `${Math.round(ageSec / 60)}m`;
  if (ageSec < 86400) return `${Math.round(ageSec / 3600)}h`;
  return `${Math.round(ageSec / 86400)}d`;
}

function formatBytesShort(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}

function TelemetryCell({ telemetry }: { telemetry: DeviceOut["telemetry"] }) {
  if (!telemetry) {
    return (
      <span className="devices-cell-telemetry devices-cell-telemetry-empty" title="Telemetry not available">
        —
      </span>
    );
  }
  const ageStr = formatHandshakeAge(telemetry.handshake_age_sec);
  const rxStr = formatBytesShort(telemetry.transfer_rx_bytes);
  const txStr = formatBytesShort(telemetry.transfer_tx_bytes);
  const healthClass =
    telemetry.reconciliation_status === "ok"
      ? "devices-telemetry-ok"
      : telemetry.reconciliation_status === "broken"
        ? "devices-telemetry-broken"
        : "devices-telemetry-degraded";
  return (
    <span
      className={`devices-cell-telemetry ${healthClass}`}
      title={`Handshake: ${ageStr} · Rx: ${rxStr} · Tx: ${txStr} · ${telemetry.reconciliation_status}`}
    >
      <span className="mono">{ageStr}</span>
      <span className="devices-telemetry-rx-tx" aria-hidden>
        {rxStr}/{txStr}
      </span>
    </span>
  );
}

function DeviceStatusBadge({ device }: { device: DeviceOut }) {
  if (device.revoked_at) {
    return (
      <span className="devices-status-badge devices-status-revoked" title="Revoked">
        Revoked
      </span>
    );
  }
  if (device.apply_status === "NO_HANDSHAKE") {
    return (
      <span className="devices-status-badge devices-status-degraded" title={device.last_error ?? "No handshake within gate"}>
        No handshake
      </span>
    );
  }
  if (device.apply_status === "FAILED_APPLY") {
    return (
      <span className="devices-status-badge devices-status-degraded" title={device.last_error ?? "Apply failed"}>
        Apply failed
      </span>
    );
  }
  const hasPending = (device.issued_configs ?? []).some((c) => !c.consumed_at);
  if (hasPending) {
    return (
      <span className="devices-status-badge devices-status-pending" title="Active, pending config">
        Pending
      </span>
    );
  }
  return (
    <span className="devices-status-badge devices-status-active" title="Active">
      Active
    </span>
  );
}

interface DevicesViewState {
  search: string;
  statusFilter: "all" | "active" | "revoked";
  viewMode: ViewMode;
  sort: string;
}

export function DevicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const regionFilter = searchParams.get("region") ?? "all";
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [sort, setSort] = useState<string>("issued_at_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [savedViews, setSavedViews] = useState<SavedView<DevicesViewState>[]>(() =>
    loadSavedViews<DevicesViewState>(DEVICES_VIEWS_SCOPE)
  );
  const [selectedViewName, setSelectedViewName] = useState("");
  const [configModal, setConfigModal] = useState<{ id: string; label: string } | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [bulkRevokeOpen, setBulkRevokeOpen] = useState(false);
  const [bulkReissueOpen, setBulkReissueOpen] = useState(false);
  const [bulkReconcileOpen, setBulkReconcileOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; action: "reissue" | "reconcile" } | null>(null);
  const [revokeDeviceId, setRevokeDeviceId] = useState<string | null>(null);
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);
  const [reissueDevice, setReissueDevice] = useState<DeviceOut | null>(null);
  const [reissueResult, setReissueResult] = useState<AdminRotatePeerResponse | null>(null);
  const [quickFilter, setQuickFilter] = useState<DevicesQuickFilter>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset>(null);
  const [detailDeviceId, setDetailDeviceId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const queryLimit = regionFilter === "all" ? LIMIT : 200;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [pollingPaused, setPollingPaused] = useState(false);
  const summaryQuery = useQuery<DeviceSummaryOut>({
    queryKey: DEVICES_SUMMARY_KEY,
    queryFn: ({ signal }) => api.get<DeviceSummaryOut>("/devices/summary", { signal }),
    refetchInterval: pollingPaused ? false : DEVICES_POLL_INTERVAL_MS,
  });
  const summary = summaryQuery.data;
  const summaryLoading = summaryQuery.isLoading;

  const { data: appSettings } = useQuery<AppSettingsOut>({
    queryKey: APP_SETTINGS_KEY,
    queryFn: ({ signal }) => api.get<AppSettingsOut>("/app/settings", { signal }),
  });
  const reconcileDisabled =
    appSettings != null &&
    (appSettings.node_mode !== "real" || appSettings.node_discovery === "agent");
  const reconcileDisabledTitle =
    appSettings?.node_discovery === "agent"
      ? "Reconcile requires NODE_DISCOVERY=docker (single-host). With NODE_DISCOVERY=agent the node-agent applies desired state."
      : "Reconcile requires NODE_MODE=real (single-host/dev). In agent mode the node-agent applies desired state.";

  const { data, error, refetch } = useQuery<DeviceList>({
    queryKey: [...DEVICES_KEY, offset, debouncedSearch, regionFilter, statusFilter, sort],
    staleTime: 45_000,
    refetchInterval: pollingPaused ? false : DEVICES_POLL_INTERVAL_MS,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(queryLimit),
        offset: String(regionFilter === "all" ? offset : 0),
        sort,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api.get<DeviceList>(`/devices?${params.toString()}`, { signal });
    },
  });

  const serversFull = useServerListFull();
  const regionOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const s of serversFull.data?.items ?? []) {
      if (s.region) unique.add(s.region);
    }
    return [
      { value: "all", label: "All regions" },
      ...Array.from(unique).sort((a, b) => a.localeCompare(b)).map((r) => ({ value: r, label: r })),
    ];
  }, [serversFull.data?.items]);

  const handleRegionChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set("region", value);
        else next.delete("region");
        return next;
      });
      setOffset(0);
    },
    [setSearchParams]
  );

  const serversQuery = useServerListForRegion(regionFilter, { enabled: regionFilter !== "all" });

  const scopedDevices = useMemo(() => {
    if (!data?.items?.length) return [];
    if (regionFilter === "all") return data.items;
    const regionServerIds = new Set(
      (serversQuery.data?.items ?? [])
        .filter((server) => (server.region ?? "") === regionFilter)
        .map((server) => server.id)
    );
    return data.items.filter((device) => regionServerIds.has(device.server_id));
  }, [data?.items, regionFilter, serversQuery.data?.items]);

  const displayDevices = useMemo(() => {
    let list = scopedDevices;
    if (quickFilter) {
      list = list.filter((d) => {
        switch (quickFilter) {
          case "handshake_ok":
            return d.telemetry && d.telemetry.handshake_age_sec != null && d.telemetry.handshake_age_sec <= 120;
          case "no_handshake":
            return d.telemetry && (d.telemetry.handshake_age_sec == null || d.telemetry.handshake_age_sec > 120);
          case "traffic_zero":
            return d.telemetry && ((d.telemetry.transfer_rx_bytes ?? 0) + (d.telemetry.transfer_tx_bytes ?? 0) === 0);
          case "no_allowed_ips": {
            const ip = d.allowed_ips?.trim();
            return !ip || ip === "0.0.0.0/0, ::/0";
          }
          default:
            return true;
        }
      });
    }
    if (viewPreset === "needs_attention") {
      list = list.filter((d) => {
        const noHandshake = d.telemetry && (d.telemetry.handshake_age_sec == null || d.telemetry.handshake_age_sec > 120);
        const trafficZero = d.telemetry && ((d.telemetry.transfer_rx_bytes ?? 0) + (d.telemetry.transfer_tx_bytes ?? 0) === 0);
        const ip = d.allowed_ips?.trim();
        const noAllowedIps = !ip || ip === "0.0.0.0/0, ::/0";
        return noHandshake || trafficZero || noAllowedIps;
      });
    } else if (viewPreset === "pending_issuance") {
      list = list.filter((d) => (d.issued_configs ?? []).some((c) => !c.consumed_at));
    }
    return list;
  }, [scopedDevices, quickFilter, viewPreset]);

  const serverNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of serversFull.data?.items ?? []) {
      m.set(s.id, s.name ?? s.id);
    }
    return m;
  }, [serversFull.data?.items]);

  const revokeMutation = useMutation({
    mutationFn: ({ deviceId, confirm_token }: { deviceId: string; confirm_token: string }) =>
      api.post(`/devices/${deviceId}/revoke`, { confirm_token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      addToast("Device revoked", "success");
      setRevokeDeviceId(null);
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Revoke failed"), "error");
    },
  });

  const bulkRevokeMutation = useMutation({
    mutationFn: (body: { device_ids: string[]; confirm_token: string }) =>
      api.post<{ revoked: number; skipped: number; errors: string[] }>("/devices/bulk-revoke", body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      addToast(`Bulk revoke: ${res.revoked} revoked, ${res.skipped} skipped`, "success");
      setBulkRevokeOpen(false);
      setSelectedDeviceIds(new Set());
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Bulk revoke failed"), "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ deviceId, confirm_token }: { deviceId: string; confirm_token: string }) =>
      api.post(`/devices/${deviceId}/delete`, { confirm_token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      addToast("Device deleted", "success");
      setDeleteDeviceId(null);
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Delete failed"), "error");
    },
  });

  const reissueMutation = useMutation({
    mutationFn: (deviceId: string) =>
      api.post<AdminRotatePeerResponse>(`/devices/${deviceId}/reissue`, {}),
    onSuccess: (data) => {
      setReissueResult(data);
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      addToast("Config reissued", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Reissue failed"), "error");
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: (deviceId: string) => api.post<{ reconciled: boolean }>(`/devices/${deviceId}/reconcile`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
      addToast("Peer reconciled on node", "success");
    },
    onError: (err) => {
      const msg = getErrorMessage(err, "Reconcile failed");
      const isDiscoveryError = msg.includes("NODE_DISCOVERY");
      const isNodeModeError = msg.includes("NODE_MODE=real");
      const friendly = isDiscoveryError
        ? "Reconcile requires NODE_DISCOVERY=docker (single-host). With NODE_DISCOVERY=agent the node-agent applies desired state."
        : isNodeModeError
          ? "Reconcile is only available when NODE_MODE=real. In agent mode the node-agent applies desired state."
          : msg;
      addToast(friendly, "error");
    },
  });

  const runBulkReissue = useCallback(async () => {
    const ids = Array.from(selectedDeviceIds);
    if (ids.length === 0) return;
    setBulkReissueOpen(false);
    let succeeded = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      setBulkProgress({ done: i, total: ids.length, action: "reissue" });
      try {
        await api.post<AdminRotatePeerResponse>(`/devices/${ids[i]}/reissue`, {});
        succeeded++;
      } catch {
        failed++;
      }
    }
    setBulkProgress({ done: ids.length, total: ids.length, action: "reissue" });
    queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
    queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
    setBulkProgress(null);
    setSelectedDeviceIds(new Set());
    addToast(`Bulk reissue: ${succeeded} succeeded${failed > 0 ? `, ${failed} failed` : ""}`, failed > 0 ? "info" : "success");
  }, [selectedDeviceIds, queryClient, addToast]);

  const runBulkReconcile = useCallback(async () => {
    const ids = Array.from(selectedDeviceIds);
    if (ids.length === 0) return;
    setBulkReconcileOpen(false);
    let succeeded = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      setBulkProgress({ done: i, total: ids.length, action: "reconcile" });
      try {
        await api.post<{ reconciled: boolean }>(`/devices/${ids[i]}/reconcile`, {});
        succeeded++;
      } catch {
        failed++;
      }
    }
    setBulkProgress({ done: ids.length, total: ids.length, action: "reconcile" });
    queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
    queryClient.invalidateQueries({ queryKey: DEVICES_SUMMARY_KEY });
    setBulkProgress(null);
    setSelectedDeviceIds(new Set());
    addToast(`Bulk reconcile: ${succeeded} succeeded${failed > 0 ? `, ${failed} failed` : ""}`, failed > 0 ? "info" : "success");
  }, [selectedDeviceIds, queryClient, addToast]);

  const toggleDeviceSelection = useCallback((id: string) => {
    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const applySavedView = (name: string) => {
    setSelectedViewName(name);
    setViewPreset(null);
    setQuickFilter(null);
    if (!name) return;
    const selected = savedViews.find((view) => view.name === name);
    if (!selected) return;
    setSearchInput(selected.state.search);
    setDebouncedSearch(selected.state.search);
    setStatusFilter(selected.state.statusFilter);
    setViewMode(selected.state.viewMode);
    setSort(selected.state.sort);
    setOffset(0);
  };

  const saveCurrentView = () => {
    const suggested = selectedViewName || "New devices view";
    const name = window.prompt("Save devices view as:", suggested)?.trim() ?? "";
    if (!name) return;
    const next = upsertSavedView<DevicesViewState>(DEVICES_VIEWS_SCOPE, savedViews, {
      name,
      state: { search: searchInput, statusFilter, viewMode, sort },
    });
    setSavedViews(next);
    setSelectedViewName(name);
  };

  const deleteCurrentView = () => {
    if (!selectedViewName) return;
    const confirmed = window.confirm(`Delete saved view "${selectedViewName}"?`);
    if (!confirmed) return;
    const next = removeSavedView<DevicesViewState>(
      DEVICES_VIEWS_SCOPE,
      savedViews,
      selectedViewName
    );
    setSavedViews(next);
    setSelectedViewName("");
  };

  const exportSelectedCsv = useCallback(() => {
    const selected = displayDevices.filter((d) => selectedDeviceIds.has(d.id));
    if (selected.length === 0) return;
    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const headers = [
      "id",
      "device_name",
      "user_id",
      "user_email",
      "status",
      "server_id",
      "node_name",
      "allowed_ips",
      "handshake_age_sec",
      "transfer_rx_bytes",
      "transfer_tx_bytes",
      "reconciliation_status",
      "issued_at",
      "revoked_at",
    ];
    const rows = selected.map((d) => [
      escape(d.id),
      escape(d.device_name ?? ""),
      escape(d.user_id),
      escape(d.user_email ?? ""),
      escape(d.revoked_at ? "revoked" : "active"),
      escape(d.server_id),
      escape(serverNameMap.get(d.server_id) ?? ""),
      escape(d.allowed_ips ?? ""),
      escape(d.telemetry?.handshake_age_sec ?? ""),
      escape(d.telemetry?.transfer_rx_bytes ?? ""),
      escape(d.telemetry?.transfer_tx_bytes ?? ""),
      escape(d.telemetry?.reconciliation_status ?? ""),
      escape(d.issued_at ?? ""),
      escape(d.revoked_at ?? ""),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `devices-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [displayDevices, selectedDeviceIds, serverNameMap]);

  if (error) {
    return (
      <div className="ref-page" data-testid="devices-page">
        <PageHeader icon={Smartphone} title="Devices" description="Issued configs and revocation state">
          <Button variant="secondary" size="sm" onClick={() => refetch()} aria-label="Retry">
            Retry
          </Button>
        </PageHeader>
        <PageError
          message={getErrorMessage(error, "Failed to load devices")}
          requestId={error instanceof ApiError ? error.requestId : undefined}
          statusCode={error instanceof ApiError ? error.statusCode : undefined}
          endpoint="GET /devices"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const columns = useMemo(() => [
    {
      key: "select",
      header: "",
      render: (r: DeviceOut) =>
        !r.revoked_at ? (
          <Checkbox
            label=""
            checked={selectedDeviceIds.has(r.id)}
            onChange={() => toggleDeviceSelection(r.id)}
            aria-label={`Select device ${r.id.slice(0, 8)}`}
          />
        ) : null,
    },
    {
      key: "device",
      header: "Device",
      render: (r: DeviceOut) => (
        <div className="devices-cell-device">
          <span className="devices-cell-device-name">{r.device_name ?? "—"}</span>
          <span className="devices-cell-device-id mono" title={r.id}>
            {r.id.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      mono: true,
      titleTooltip: (r: DeviceOut) => (r.user_email ? `${r.user_id} · ${r.user_email}` : String(r.user_id)),
      render: (r: DeviceOut) => r.user_id,
    },
    {
      key: "status",
      header: "Status",
      render: (r: DeviceOut) => <DeviceStatusBadge device={r} />,
    },
    {
      key: "ip",
      header: "IP",
      mono: true,
      render: (r: DeviceOut) => {
        const ip = r.allowed_ips?.trim();
        const invalid = !ip || ip === "0.0.0.0/0, ::/0";
        if (invalid) {
          return (
            <span className="devices-cell-ip-warn" title="No valid AllowedIPs">
              ⚠ —
            </span>
          );
        }
        return <span title={ip}>{ip}</span>;
      },
    },
    {
      key: "issued_configs",
      header: "Configs",
      render: (r: DeviceOut) => (
        <ConfigChipsCell
          configs={r.issued_configs ?? []}
          onShow={(id, label) => setConfigModal({ id, label })}
        />
      ),
    },
    {
      key: "telemetry",
      header: "Telemetry",
      render: (r: DeviceOut) => <TelemetryCell telemetry={r.telemetry} />,
    },
    {
      key: "node",
      header: "Node",
      render: (r: DeviceOut) => (
        <span className="mono" title={r.server_id}>
          {serverNameMap.get(r.server_id) ?? r.server_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      render: (r: DeviceOut) => (
        <span className="ref-device-actions">
          {!r.revoked_at && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setReissueDevice(r)}
              disabled={reissueMutation.isPending}
              aria-label="Reissue config"
              title="Reissue"
            >
              <RefreshCw aria-hidden strokeWidth={1.5} size={14} />
            </Button>
          )}
          <DropdownMenu
            portal
            trigger={
              <Button variant="ghost" size="icon" aria-label="More actions" title="More actions">
                <MoreVertical aria-hidden strokeWidth={1.5} size={14} />
              </Button>
            }
            items={[
              {
                id: "view-details",
                label: "View details",
                onClick: () => setDetailDeviceId(r.id),
              },
              ...(!r.revoked_at
                ? [
                  ...(reconcileDisabled
                    ? []
                    : [
                      {
                        id: "reconcile",
                        label: "Reconcile peer",
                        onClick: () => reconcileMutation.mutate(r.id),
                      },
                    ]),
                  {
                    id: "revoke",
                    label: "Revoke",
                    onClick: () => setRevokeDeviceId(r.id),
                    danger: true,
                  },
                ]
                : []),
              {
                id: "delete",
                label: "Delete",
                onClick: () => setDeleteDeviceId(r.id),
                danger: true,
              },
              ...((r.issued_configs?.length ?? 0) > 0
                ? [
                  {
                    id: "view-configs",
                    label: "View configs",
                    onClick: () =>
                      r.issued_configs?.[0] &&
                      setConfigModal({
                        id: r.issued_configs[0].id,
                        label: configLabel(r.issued_configs[0]),
                      }),
                  },
                ]
                : []),
            ]}
          />
        </span>
      ),
    },
  ], [
    selectedDeviceIds,
    serverNameMap,
    toggleDeviceSelection,
    reissueMutation.isPending,
    reconcileDisabled,
    reconcileMutation.isPending,
    revokeMutation.isPending,
    deleteMutation.isPending
  ]);

  return (
    <div className="ref-page" data-testid="devices-page">
      <PageHeader
        icon={Smartphone}
        title="Devices"
        description="Issued configs and revocation state"
      >
        {regionFilter !== "all" ? <PrimitiveBadge variant="info">Region: {regionFilter}</PrimitiveBadge> : null}
      </PageHeader>

      <DevicesControlBar
        search={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v as "all" | "active" | "revoked");
          setOffset(0);
        }}
        regionFilter={regionFilter}
        onRegionChange={handleRegionChange}
        regionOptions={regionOptions}
        summary={summary}
        summaryLoading={summaryLoading}
        onBulkActionsClick={() => setBulkRevokeOpen(true)}
        hasSelection={selectedDeviceIds.size > 0}
        onSearchSubmit={() => setOffset(0)}
      />

      <div className="devices-metrics-row">
        <DevicesMetricsStrip
          summary={summary}
          summaryLoading={summaryLoading}
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
        />
        <DevicesTelemetryHealth
          summary={summary}
          summaryLoading={summaryLoading}
          pollingPaused={pollingPaused}
          onPollingToggle={() => setPollingPaused((p) => !p)}
        />
      </div>

      <TableSection
        pagination={regionFilter === "all" && data && data.total > LIMIT ? { offset, limit: LIMIT, total: data.total, onPage: setOffset } : undefined}
      >
        <div className="devices-panel">
          <div className="ref-devices-views" style={{ marginBottom: "var(--spacing-2)" }}>
            <span className="ref-users-view-label">Presets</span>
            <Button
              type="button"
              variant={viewPreset === "needs_attention" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewPreset(viewPreset === "needs_attention" ? null : "needs_attention");
                setQuickFilter(null);
              }}
              aria-pressed={viewPreset === "needs_attention"}
            >
              Needs attention
            </Button>
            <Button
              type="button"
              variant={viewPreset === "pending_issuance" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewPreset(viewPreset === "pending_issuance" ? null : "pending_issuance");
                setQuickFilter(null);
              }}
              aria-pressed={viewPreset === "pending_issuance"}
            >
              Pending issuance
            </Button>
            <Button
              type="button"
              variant={viewPreset === "recently_active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setViewPreset(viewPreset === "recently_active" ? null : "recently_active");
                setSort("issued_at_desc");
                setStatusFilter("active");
                setQuickFilter(null);
                setOffset(0);
              }}
              aria-pressed={viewPreset === "recently_active"}
            >
              Recently active
            </Button>
            <label htmlFor="devices-view-select" className="ref-users-view-label" style={{ marginLeft: "var(--spacing-4)" }}>Saved views</label>
            <select
              id="devices-view-select"
              className="input ref-users-view-select"
              value={selectedViewName}
              onChange={(e) => applySavedView(e.target.value)}
              aria-label="Apply saved devices view"
            >
              <option value="">Select view</option>
              {savedViews.map((view) => (
                <option key={view.name} value={view.name}>
                  {view.name}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" onClick={saveCurrentView}>
              Save view
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!selectedViewName}
              onClick={deleteCurrentView}
            >
              Delete view
            </Button>
            <Select
              options={[...SORT_OPTIONS]}
              value={sort}
              onChange={setSort}
              aria-label="Sort"
              className="ref-sort-select"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
              aria-pressed={viewMode === "table"}
            >
              {viewMode === "cards" ? "Table" : "Cards"}
            </Button>
          </div>
          {selectedDeviceIds.size > 0 && (
            <DevicesBulkPanel
              selectedCount={selectedDeviceIds.size}
              onClear={() => setSelectedDeviceIds(new Set())}
              onRevoke={() => setBulkRevokeOpen(true)}
              onReissue={() => setBulkReissueOpen(true)}
              onReconcile={() => setBulkReconcileOpen(true)}
              onExportCsv={exportSelectedCsv}
              onDelete={() => addToast("Use row actions to delete a device", "info")}
              revokeLoading={bulkRevokeMutation.isPending}
              deleteLoading={deleteMutation.isPending}
              reissueLoading={!!bulkProgress && bulkProgress.action === "reissue"}
              reconcileLoading={!!bulkProgress && bulkProgress.action === "reconcile"}
              reconcileDisabled={reconcileDisabled}
              reconcileDisabledTitle={reconcileDisabledTitle}
              bulkProgress={bulkProgress ?? undefined}
            />
          )}
          {displayDevices.length > 0 && selectedDeviceIds.size === 0 && (
            <HelperText variant="hint" className="ref-devices-helper">
              Select rows to bulk revoke.
            </HelperText>
          )}
        </div>
        {viewMode === "cards" && displayDevices.length ? (
          <ul className="device-card-list">
            {displayDevices.map((d) => {
              const configs = d.issued_configs ?? [];
              return (
                <li key={d.id}>
                  <DeviceCard
                    id={d.id}
                    name={d.device_name}
                    status={d.revoked_at ? "revoked" : "active"}
                    issuedAt={d.issued_at}
                    shortId={d.id.slice(0, 8)}
                    secondaryActions={
                      <span className="ref-device-card-actions">
                        {!d.revoked_at && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReissueDevice(d)}
                              disabled={reissueMutation.isPending}
                            >
                              Reissue
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRevokeDeviceId(d.id)}
                              disabled={revokeMutation.isPending}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDeviceId(d.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </span>
                    }
                  />
                  {configs.length > 0 ? (
                    <div className="ref-device-configs">
                      <ConfigChipsCell
                        configs={configs}
                        onShow={(id, label) => setConfigModal({ id, label })}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : viewMode === "table" && (displayDevices.length >= 50 || (data?.total ?? 0) >= 50 || queryLimit >= 50) ? (
          <VirtualTable<DeviceOut>
            columns={columns}
            data={displayDevices}
            keyExtractor={(r) => r.id}
            emptyMessage="No devices found"
            density="compact"
            className="devices-table devices-table-zebra"
            maxHeight={520}
            overscan={8}
          />
        ) : (
          <Table
            columns={columns}
            data={displayDevices}
            keyExtractor={(r) => r.id}
            emptyMessage="No devices found"
            density="compact"
            className="devices-table devices-table-zebra"
          />
        )}
      </TableSection>
      <ConfirmDanger
        open={revokeDeviceId !== null}
        onClose={() => setRevokeDeviceId(null)}
        title="Revoke device"
        message={
          revokeDeviceId
            ? `Revoke device ${revokeDeviceId.slice(0, 8)}? The device will no longer be able to connect.`
            : ""
        }
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={(payload) => {
          if (revokeDeviceId && payload.confirm_token) {
            revokeMutation.mutate({ deviceId: revokeDeviceId, confirm_token: payload.confirm_token });
          }
        }}
        confirmLabel="Revoke device"
        cancelLabel="Cancel"
        loading={revokeMutation.isPending}
      />
      <ConfirmModal
        open={bulkReissueOpen}
        onClose={() => setBulkReissueOpen(false)}
        onConfirm={() => {
          setBulkReissueOpen(false);
          void runBulkReissue();
        }}
        title="Bulk reissue"
        message={`Will reissue configs for ${selectedDeviceIds.size} selected device(s). Proceed?`}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
      />
      <ConfirmModal
        open={bulkReconcileOpen}
        onClose={() => setBulkReconcileOpen(false)}
        onConfirm={() => {
          setBulkReconcileOpen(false);
          void runBulkReconcile();
        }}
        title="Bulk reconcile"
        message={`Will reconcile peers on node for ${selectedDeviceIds.size} selected device(s). Proceed?`}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
      />
      <ConfirmDanger
        open={bulkRevokeOpen}
        onClose={() => setBulkRevokeOpen(false)}
        title="Bulk revoke"
        message={`Enter confirmation token to revoke ${selectedDeviceIds.size} selected device(s).`}
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={(payload) => {
          if (payload.confirm_token) {
            bulkRevokeMutation.mutate({
              device_ids: Array.from(selectedDeviceIds),
              confirm_token: payload.confirm_token,
            });
          }
        }}
        confirmLabel={`Revoke ${selectedDeviceIds.size} device(s)`}
        cancelLabel="Cancel"
        loading={bulkRevokeMutation.isPending}
      />
      <ConfirmDanger
        open={deleteDeviceId !== null}
        onClose={() => setDeleteDeviceId(null)}
        title="Delete device"
        message={
          deleteDeviceId
            ? `Permanently delete device ${deleteDeviceId.slice(0, 8)}? This removes the device and its issued configs.`
            : ""
        }
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={(payload) => {
          if (deleteDeviceId && payload.confirm_token) {
            deleteMutation.mutate({ deviceId: deleteDeviceId, confirm_token: payload.confirm_token });
          }
        }}
        confirmLabel="Delete device"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
      />
      <ConfigContentModal
        open={!!configModal}
        onClose={() => setConfigModal(null)}
        issuedConfigId={configModal?.id ?? null}
        label={configModal?.label}
      />
      <ReissueConfigModal
        open={!!reissueDevice}
        onClose={() => {
          setReissueDevice(null);
          setReissueResult(null);
          queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
        }}
        device={reissueDevice}
        result={reissueResult}
        loading={reissueMutation.isPending}
        onConfirm={() => reissueDevice && reissueMutation.mutate(reissueDevice.id)}
      />
      <DeviceDetailDrawer
        deviceId={detailDeviceId}
        open={!!detailDeviceId}
        onClose={() => setDetailDeviceId(null)}
        onReissue={setReissueDevice}
      />
    </div>
  );
}
