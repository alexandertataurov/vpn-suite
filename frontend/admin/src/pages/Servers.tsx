import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Server } from "lucide-react";
import { Panel, Button, InlineAlert, Checkbox, EmptyState, Input, ConfirmDanger, Modal, PageError, Pagination, Tabs, TableContainer, TableSkeleton, useToast, HelperText } from "@vpn-suite/shared/ui";
import { getErrorMessage } from "@vpn-suite/shared";
import type { ServerDeviceCountsOut, ServerOut, ServerSyncResponse } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import {
  SERVERS_LIST_KEY,
  SERVERS_SNAPSHOTS_SUMMARY_KEY,
  serversDeviceCountsKey,
} from "../api/query-keys";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useServerList, useServersSnapshotSummary, useServersTelemetrySummary } from "../hooks/useServerList";
import { useResourceFromQuery } from "../hooks/useResource";
import { useServersStream } from "../hooks/useServersStream";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { FilterBar } from "../components/FilterBar";
import { ServersToolbar } from "../components/servers/ServersToolbar";
import { IssueConfigModal } from "../components/IssueConfigModal";
import { PageHeader } from "../components/PageHeader";
import { ServerRow } from "../components/ServerRow";
import { ServerRowDrawer } from "../components/ServerRowDrawer";
import { isSnapshotStale, isStale } from "../components/ServerRow";
import { ButtonLink } from "../components/ButtonLink";
import { serversLogger } from "../utils/serversLogger";

function errorToastMessage(err: unknown, fallback: string): string {
  const msg = getErrorMessage(err, fallback);
  const rid = err instanceof ApiError ? err.requestId : undefined;
  return rid ? `${msg} (request_id=${rid})` : msg;
}

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "degraded", label: "Degraded" },
  { value: "unknown", label: "Unknown" },
];

const PRESETS = [
  { id: "degraded", label: "Degraded", status: "degraded" as const },
  { id: "offline", label: "Offline", status: "offline" as const },
  { id: "needs-attention", label: "Needs attention", attentionFilter: true as const },
  { id: "my-region", label: "My region", regionKey: true },
] as const;

function serverNeedsAttention(s: ServerOut): boolean {
  const status = (s.status ?? "unknown").toLowerCase();
  if (["degraded", "offline", "unknown"].includes(status)) return true;
  if (!s.is_active) return true;
  if (isSnapshotStale(s.last_snapshot_at)) return true;
  if (isStale(s.last_seen_at)) return true;
  return false;
}

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "created_at_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "region_asc", label: "Region A–Z" },
];

const DENSITY_STORAGE_KEY = "vpn-suite-servers-density";

const LAST_SEEN_OPTIONS = [
  { value: "all", label: "All servers" },
  { value: "24", label: "Seen in 24h" },
  { value: "168", label: "Seen in 7d" },
];

export function ServersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "");
  const [restartServer, setRestartServer] = useState<ServerOut | null>(null);
  const [deleteServer, setDeleteServer] = useState<ServerOut | null>(null);
  const [issueConfigServer, setIssueConfigServer] = useState<ServerOut | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [density, setDensity] = useState<"compact" | "normal">(() => {
    if (typeof localStorage === "undefined") return "normal";
    const v = localStorage.getItem(DENSITY_STORAGE_KEY);
    return v === "compact" ? "compact" : "normal";
  });
  const [selectedServerIds, setSelectedServerIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"mark_draining" | "unmark_draining" | "disable_provisioning" | "enable_provisioning" | null>(null);
  const [bulkConfirmCode, setBulkConfirmCode] = useState("");
  const [syncingServerId, setSyncingServerId] = useState<string | null>(null);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ total: number; done: number; errors: number } | null>(null);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const regionFilter = searchParams.get("region") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";
  const searchTerm = searchParams.get("search") ?? "";
  const sortParam = searchParams.get("sort") ?? "created_at_desc";
  const pageParam = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const lastSeenParam = searchParams.get("last_seen");
  const lastSeenWithinHours =
    lastSeenParam === "24" ? 24 : lastSeenParam === "168" ? 168 : undefined;
  const attentionFilter = searchParams.get("attention") === "1";

  const presetItems = useMemo(
    () => PRESETS.map((p) => ({ id: p.id, label: p.label })),
    []
  );
  const activePreset = useMemo(() => {
    if (attentionFilter) return "needs-attention";
    if (statusFilter === "degraded") return "degraded";
    if (statusFilter === "offline") return "offline";
    if (regionFilter !== "all") return "my-region";
    return "";
  }, [attentionFilter, statusFilter, regionFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) next.set("search", searchInput.trim());
        else next.delete("search");
        next.delete("page");
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, setSearchParams]);

  const handleStatusChange = useCallback(
    (status: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (status && status !== "all") next.set("status", status);
        else next.delete("status");
        next.delete("page");
        return next;
      });
    },
    [setSearchParams]
  );

  const handleSortChange = useCallback(
    (sort: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (sort && sort !== "created_at_desc") next.set("sort", sort);
        else next.delete("sort");
        next.delete("page");
        return next;
      });
    },
    [setSearchParams]
  );

  const handleLastSeenChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set("last_seen", value);
        else next.delete("last_seen");
        next.delete("page");
        return next;
      });
    },
    [setSearchParams]
  );

  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("page");
        if ("status" in preset && preset.status) {
          next.set("status", preset.status);
          next.delete("attention");
        } else if ("attentionFilter" in preset && preset.attentionFilter) {
          if (prev.get("attention") === "1") next.delete("attention");
          else next.set("attention", "1");
          next.delete("status");
        } else {
          next.delete("status");
          next.delete("attention");
        }
        if ("regionKey" in preset && preset.regionKey) {
          const r = regionFilter !== "all" ? regionFilter : (typeof localStorage !== "undefined" ? localStorage.getItem("vpn-suite-admin-region") : null) ?? "all";
          if (r !== "all") next.set("region", r);
          else next.delete("region");
        } else if ("status" in preset || ("attentionFilter" in preset && preset.attentionFilter)) {
          next.delete("region");
        }
        return next;
      });
    },
    [setSearchParams, regionFilter]
  );

  const handlePresetChange = useCallback(
    (id: string) => {
      const preset = PRESETS.find((p) => p.id === id);
      if (preset) handlePreset(preset);
    },
    [handlePreset]
  );

  const handlePageChange = useCallback(
    (newOffset: number) => {
      const nextPage = Math.floor(Math.max(0, newOffset) / LIMIT) + 1;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage <= 1) next.delete("page");
        else next.set("page", String(nextPage));
        return next;
      });
    },
    [setSearchParams]
  );

  const { connectionState, retry } = useServersStream(true);
  const serverListQuery = useServerList({
    region: regionFilter,
    status: statusFilter,
    search: searchTerm,
    sort: sortParam,
    page: regionFilter === "all" ? pageParam : undefined,
    pageSize: LIMIT,
    limit: LIMIT,
    lastSeenWithinHours,
  });
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
    isNetworkCooldown,
    networkCooldownRemainingMs,
    clearNetworkCooldown,
  } = serverListQuery;

  useEffect(() => {
    if (connectionState !== "degraded") return;
    const id = setInterval(
      () => queryClient.refetchQueries({ queryKey: SERVERS_LIST_KEY }),
      30_000
    );
    return () => clearInterval(id);
  }, [connectionState, queryClient]);

  const serversResource = useResourceFromQuery(
    "GET /servers",
    SERVERS_LIST_KEY,
    serverListQuery,
    15_000,
    { isEmpty: (payload) => !payload || payload.items.length === 0 }
  );

  const telemetrySummary = useServersTelemetrySummary({
    region: regionFilter,
    status: statusFilter,
    search: searchTerm,
  });
  const telemetryQueryKey = [
    ...SERVERS_LIST_KEY,
    "telemetry-summary",
    regionFilter,
    statusFilter,
    searchTerm,
  ] as const;
  const telemetryResource = useResourceFromQuery(
    "GET /servers/telemetry/summary",
    telemetryQueryKey,
    telemetrySummary,
    15_000,
    { isEmpty: (payload) => !payload || !Object.keys(payload.servers ?? {}).length }
  );

  const snapshotSummary = useServersSnapshotSummary();
  const snapshotResource = useResourceFromQuery(
    "GET /servers/snapshots/summary",
    SERVERS_SNAPSHOTS_SUMMARY_KEY,
    snapshotSummary,
    30_000,
    { isEmpty: (payload) => !payload || !Object.keys(payload.servers ?? {}).length }
  );

  const [skipDeviceCounts404, setSkipDeviceCounts404] = useState(
    () =>
      typeof sessionStorage !== "undefined" &&
      !!sessionStorage.getItem("vpn-suite-servers-device-counts-404")
  );
  const deviceCountsQuery = useQuery<ServerDeviceCountsOut>({
    queryKey: serversDeviceCountsKey(skipDeviceCounts404),
    queryFn: async ({ signal }) => {
      try {
        return await api.get<ServerDeviceCountsOut>("/servers/device-counts", { signal });
      } catch (e) {
        const err = e as { statusCode?: number };
        if (err?.statusCode === 404) {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("vpn-suite-servers-device-counts-404", "1");
          }
          setSkipDeviceCounts404(true);
          return { counts: {} };
        }
        throw e;
      }
    },
    staleTime: 30_000,
    retry: (_, error) => (error as { statusCode?: number })?.statusCode === 404 ? false : true,
    enabled: !skipDeviceCounts404,
    placeholderData: skipDeviceCounts404 ? { counts: {} } : undefined,
  });

  const visibleItems = useMemo(() => {
    if (!data) return [];
    let items = data.items;
    const hasFilters = statusFilter !== "all" || searchTerm.trim() || regionFilter !== "all";
    if (regionFilter === "all" && !hasFilters && pageParam === 1 && items.length > LIMIT) {
      items = items.slice(0, LIMIT);
    }
    if (attentionFilter) {
      items = items.filter(serverNeedsAttention);
    }
    return items;
  }, [data, regionFilter, statusFilter, searchTerm, pageParam, attentionFilter]);

  const devicesByServer = useMemo(() => {
    const map = new Map<string, number>();
    const counts = deviceCountsQuery.data?.counts ?? {};
    for (const [serverId, count] of Object.entries(counts)) {
      map.set(serverId, count);
    }
    return map;
  }, [deviceCountsQuery.data?.counts]);

  const VIRTUAL_THRESHOLD = 200;
  const rowHeight = density === "compact" ? 48 : 64;
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });
  const virtualRows = visibleItems.length > VIRTUAL_THRESHOLD ? virtualizer.getVirtualItems() : null;
  const showInlineDetails = !virtualRows;

  const restartMutation = useMutation({
    mutationFn: ({ id, reason, confirm_token }: { id: string; reason: string; confirm_token: string }) =>
      api.post(`/servers/${id}/restart`, {
        confirm_token,
        reason: reason || "Restart from admin",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      addToast("Restart requested. Server will restart shortly.", "success");
      setRestartServer(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError && err.statusCode === 501
          ? "Restart is not supported in this deployment."
          : errorToastMessage(err, "Restart failed");
      addToast(msg, "error");
      setRestartServer(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (serverId: string) =>
      api.post<ServerSyncResponse>(`/servers/${serverId}/sync`, { mode: "manual" }),
    onSuccess: (data, serverId) => {
      setSyncingServerId(null);
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: SERVERS_SNAPSHOTS_SUMMARY_KEY });
      serversLogger.serversSync({
        serverId,
        success: true,
        requestId: data.request_id ?? undefined,
      });
      const msg = data.action_id
        ? `Sync queued (agent mode). action_id=${data.action_id}`
        : `Sync completed. request_id=${data.request_id || ""}`;
      addToast(msg, "success");
    },
    onError: (err, serverId) => {
      setSyncingServerId(null);
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      serversLogger.serversSync({
        serverId,
        success: false,
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
      addToast(errorToastMessage(err, "Sync failed"), "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serverId: string) =>
      api.request(`/servers/${serverId}`, { method: "DELETE" }),
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: SERVERS_SNAPSHOTS_SUMMARY_KEY });
      serversLogger.serverDelete({ serverId, success: true });
      addToast("Server removed", "success");
      setDeleteServer(null);
      setSelectedServerId(null);
    },
    onError: (err, serverId) => {
      serversLogger.serverDelete({
        serverId,
        success: false,
        statusCode: err instanceof ApiError ? err.statusCode : undefined,
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
      const msg =
        err instanceof ApiError && err.statusCode === 409
          ? "Cannot delete: server has active devices. Move or revoke them first."
          : errorToastMessage(err, "Delete failed");
      addToast(msg, "error");
      setDeleteServer(null);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ serverId, type }: { serverId: string; type: string }) =>
      api.post<{ action_id: string }>(`/servers/${serverId}/actions`, { type }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      addToast(`Action ${v.type} queued`, "success");
    },
    onError: (err) => {
      addToast(errorToastMessage(err, "Action failed"), "error");
    },
  });

  const handleConfirmRestart = (payload: { reason?: string; confirm_token?: string }) => {
    if (restartServer && payload.confirm_token) {
      restartMutation.mutate({
        id: restartServer.id,
        reason: payload.reason ?? "Restart from admin",
        confirm_token: payload.confirm_token,
      });
    }
  };

  const bulkMutation = useMutation({
    mutationFn: (body: { server_ids: string[]; action: string; confirm_token?: string }) =>
      api.patch<{ updated: number; server_ids: string[] }>("/servers/bulk", body),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
      addToast(`Updated ${v.server_ids.length} server(s)`, "success");
      setSelectedServerIds(new Set());
      setBulkAction(null);
      setBulkConfirmCode("");
    },
    onError: (err) => addToast(errorToastMessage(err, "Bulk action failed"), "error"),
  });

  const handleBulkAction = (action: "mark_draining" | "unmark_draining" | "disable_provisioning" | "enable_provisioning") => {
    if (action === "disable_provisioning" || action === "enable_provisioning") {
      setBulkAction(action);
    } else {
      bulkMutation.mutate({ server_ids: Array.from(selectedServerIds), action });
    }
  };

  const handleConfirmBulk = () => {
    if (bulkAction && bulkConfirmCode.trim()) {
      bulkMutation.mutate({
        server_ids: Array.from(selectedServerIds),
        action: bulkAction,
        confirm_token: bulkConfirmCode.trim(),
      });
      setBulkAction(null);
      setBulkConfirmCode("");
    }
  };

  const handleBulkSync = useCallback(async () => {
    const ids = Array.from(selectedServerIds);
    if (!ids.length) return;
    setBulkSyncProgress({ total: ids.length, done: 0, errors: 0 });
    let done = 0;
    let errors = 0;
    let lastErr: unknown = null;
    for (const id of ids) {
      try {
        await api.post<ServerSyncResponse>(`/servers/${id}/sync`, { mode: "manual" });
      } catch (e) {
        errors += 1;
        lastErr = e;
      }
      done += 1;
      setBulkSyncProgress((p) => p ? { ...p, done, errors } : null);
    }
    queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
    queryClient.invalidateQueries({ queryKey: SERVERS_SNAPSHOTS_SUMMARY_KEY });
    setBulkSyncProgress(null);
    setSelectedServerIds(new Set());
    const base = `Synced ${done - errors}/${done} server(s)${errors ? ` (${errors} failed)` : ""}`;
    const rid = lastErr instanceof ApiError ? lastErr.requestId : undefined;
    addToast(rid && errors ? `${base} (request_id=${rid})` : base, errors ? "error" : "success");
  }, [selectedServerIds, queryClient, addToast]);

  const toggleSelectServer = (id: string) => {
    setSelectedServerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedServerIds.size === visibleItems.length) {
      setSelectedServerIds(new Set());
    } else {
      setSelectedServerIds(new Set(visibleItems.map((s) => s.id)));
    }
  };

  if (error && !data) {
    const statusCode = error instanceof ApiError ? error.statusCode : undefined;
    return (
      <div className="ref-page" data-testid="servers-page">
        <PageHeader icon={Server} title="Servers" description="Manage your VPN servers and configurations">
          <Button variant="secondary" size="sm" onClick={() => refetch()} aria-label="Retry">
            Retry
          </Button>
        </PageHeader>
        {statusCode === 403 ? (
          <InlineAlert
            variant="error"
            title="Permission denied"
            message="You do not have permission to view servers. Contact your administrator."
          />
        ) : (
          <PageError
            message={getErrorMessage(error, "Failed to load servers")}
            requestId={error instanceof ApiError ? error.requestId : undefined}
            statusCode={statusCode}
            endpoint="GET /servers"
            onRetry={() => refetch()}
          />
        )}
      </div>
    );
  }

  const hasStaleCacheBanner = !!error && !!data;
  const hasTelemetryError = telemetryResource.status === "error" || snapshotResource.status === "error";

  return (
    <div className="ref-page" data-testid="servers-page">
      <PageHeader
        icon={Server}
        title="Servers"
        description="Manage your VPN servers and configurations"
        primaryAction={
          <ButtonLink to="/servers/new" variant="primary">
            Add Server
          </ButtonLink>
        }
      >
        <div className="page-header-toolbar-group">
        <ServersToolbar
          dataUpdatedAt={dataUpdatedAt}
          isFetching={isFetching}
          isStale={serversResource.status === "stale"}
          hasError={serversResource.status === "error"}
          onSync={async () => {
            try {
              await serversResource.refresh();
              addToast("Servers list refreshed", "success");
            } catch (e) {
              addToast(errorToastMessage(e, "Sync failed"), "error");
            }
          }}
          connectionState={connectionState}
          liveIntervalSeconds={30}
        >
          <FilterBar
          search={searchInput}
          onSearch={setSearchInput}
          searchPlaceholder="Search name or endpoint"
          searchLabel="Search servers"
          statusOptions={STATUS_OPTIONS}
          statusValue={statusFilter}
          onStatusChange={handleStatusChange}
          sortOptions={SORT_OPTIONS}
          sortValue={sortParam}
          onSortChange={handleSortChange}
          lastSeenOptions={LAST_SEEN_OPTIONS}
          lastSeenValue={lastSeenParam ?? "all"}
          onLastSeenChange={handleLastSeenChange}
          lastSeenLabel="Show servers seen within"
          density={density}
          onDensityChange={() => {
            const next = density === "compact" ? "normal" : "compact";
            setDensity(next);
            if (typeof localStorage !== "undefined") localStorage.setItem(DENSITY_STORAGE_KEY, next);
          }}
          />
        </ServersToolbar>
        </div>
      </PageHeader>

      <Panel as="section" variant="outline" className="servers-panel" aria-label="Servers list">
        <div className="operator-section-title" role="heading" aria-level={2}>
          <Server className="operator-section-icon" aria-hidden size={14} strokeWidth={2} />
          Servers list
        </div>
      <Tabs
        items={presetItems}
        value={activePreset}
        onChange={handlePresetChange}
        ariaLabel="Filter presets"
        size="sm"
        className="ref-presets"
        idPrefix="servers-preset"
        data-testid="servers-presets"
      />

      {typeof navigator !== "undefined" && !navigator.onLine && (
        <InlineAlert
          variant="warning"
          title="You are offline"
          message="Changes cannot be saved. Connect to the network and sync."
        />
      )}
      {isNetworkCooldown && (
        <InlineAlert
          variant="error"
          title="API unreachable"
          message={`DNS/network failure detected. Auto-refresh paused for ${Math.ceil(networkCooldownRemainingMs / 1000)}s.`}
          actions={<Button variant="ghost" size="sm" onClick={() => { clearNetworkCooldown(); void refetch(); }}>Retry now</Button>}
        />
      )}
      {hasStaleCacheBanner && (
        <InlineAlert
          variant="warning"
          title="Data may be stale"
          message={`Last successful update: ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour12: false }) : "unknown"}. Refetch failed.`}
          actions={<Button variant="ghost" size="sm" onClick={() => refetch()}>Retry</Button>}
        />
      )}
      {hasTelemetryError && (
        <InlineAlert
          variant="warning"
          title="Telemetry degraded"
          message="CPU, RAM, or snapshot data may not be shown. Use Retry to fetch again."
          actions={
            <>
              {telemetrySummary.isError && (
                <Button variant="ghost" size="sm" onClick={() => telemetrySummary.refetch()}>Retry telemetry</Button>
              )}
              {snapshotSummary.isError && (
                <Button variant="ghost" size="sm" onClick={() => snapshotSummary.refetch()}>Retry snapshots</Button>
              )}
            </>
          }
        />
      )}
      {connectionState === "degraded" && (
        <InlineAlert
          variant="warning"
          title="Live updates paused"
          message="Polling every 30s. Use Retry to reconnect."
          actions={<Button variant="ghost" size="sm" onClick={retry}>Retry live updates</Button>}
        />
      )}

      {!isLoading && visibleItems.length > 0 && selectedServerIds.size === 0 && (
        <HelperText variant="hint" className="mb-2">
          Select rows to bulk sync or change drain/provisioning.
        </HelperText>
      )}

      <ErrorBoundary>
      {isLoading ? (
        <TableSkeleton rows={4} columns={11} density={density === "compact" ? "compact" : "comfortable"} data-testid="servers-loading" />
      ) : visibleItems.length ? (
        <>
          {selectedServerIds.size > 0 && (
            <div className="ref-bulk-toolbar">
              <span>
                {bulkSyncProgress
                  ? `Syncing ${bulkSyncProgress.done}/${bulkSyncProgress.total}`
                  : `${selectedServerIds.size} selected`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkSync}
                disabled={bulkMutation.isPending || !!bulkSyncProgress}
              >
                Sync
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("mark_draining")} disabled={bulkMutation.isPending}>
                Mark draining
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("unmark_draining")} disabled={bulkMutation.isPending}>
                Unmark draining
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("disable_provisioning")} disabled={bulkMutation.isPending}>
                Disable provisioning
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkAction("enable_provisioning")} disabled={bulkMutation.isPending}>
                Enable provisioning
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedServerIds(new Set())}>
                Clear
              </Button>
            </div>
          )}
          <TableContainer
            ref={parentRef}
            maxHeight={visibleItems.length > VIRTUAL_THRESHOLD ? 480 : undefined}
            className={density === "compact" ? "table-density-compact" : undefined}
          >
            <table className="table servers-table operator-server-table" data-testid="servers-table">
              <thead>
                <tr>
                  <th className="ref-table-check-col servers-table-col-check">
                    <Checkbox
                      id="select-all"
                      label=""
                      checked={visibleItems.length > 0 && selectedServerIds.size === visibleItems.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="servers-table-col-status">Status</th>
                  <th className="servers-table-col-health num">Health</th>
                  <th className="servers-table-col-name">Name</th>
                  <th className="servers-table-col-region">Region</th>
                  <th className="servers-table-col-lastseen">Last seen</th>
                  <th className="servers-table-col-lastsync">Last sync</th>
                  <th className="servers-table-col-peers num" title={skipDeviceCounts404 ? "Device counts unavailable" : undefined}>
                    Peers{skipDeviceCounts404 ? " (unavailable)" : ""}
                  </th>
                  <th className="servers-table-col-ips num">IPs</th>
                  <th className="servers-table-col-telemetry">Telemetry</th>
                  <th className="servers-table-col-actions"></th>
                </tr>
              </thead>
              <tbody
                style={
                  visibleItems.length > VIRTUAL_THRESHOLD && virtualRows
                    ? { height: `${virtualizer.getTotalSize()}px`, position: "relative" }
                    : undefined
                }
              >
                {(virtualRows
                  ? virtualRows.map((virtualRow) => {
                      const server = visibleItems[virtualRow.index];
                      if (!server) return <tr key={virtualRow.key}><td colSpan={10} /></tr>;
                      return (
                        <ServerRow
                          key={server.id}
                          server={server}
                          selected={selectedServerIds.has(server.id)}
                          onSelect={() => toggleSelectServer(server.id)}
                          snapshotSummary={snapshotSummary.data}
                          telemetrySummary={telemetrySummary.data}
                          devicesByServer={devicesByServer}
                          syncingServerId={syncingServerId}
                          showInlineDetails={showInlineDetails}
                          virtualStyle={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          onRowClick={() => setSelectedServerId(server.id)}
                          onSync={() => { setSyncingServerId(server.id); syncMutation.mutate(server.id); }}
                          onReconcile={() => actionMutation.mutate({ serverId: server.id, type: "apply_peers" })}
                          onIssueConfig={() => setIssueConfigServer(server)}
                          onRestart={() => setRestartServer(server)}
                          onDrainUndrain={() => actionMutation.mutate({ serverId: server.id, type: server.is_draining ? "undrain" : "drain" })}
                          onDelete={() => setDeleteServer(server)}
                        />
                      );
                    })
                  : visibleItems.map((server) => (
                      <ServerRow
                        key={server.id}
                        server={server}
                        selected={selectedServerIds.has(server.id)}
                        onSelect={() => toggleSelectServer(server.id)}
                        snapshotSummary={snapshotSummary.data}
                        telemetrySummary={telemetrySummary.data}
                        devicesByServer={devicesByServer}
                        syncingServerId={syncingServerId}
                        showInlineDetails={showInlineDetails}
                        onRowClick={() => setSelectedServerId(server.id)}
                        onSync={() => { setSyncingServerId(server.id); syncMutation.mutate(server.id); }}
                        onReconcile={() => actionMutation.mutate({ serverId: server.id, type: "apply_peers" })}
                        onIssueConfig={() => setIssueConfigServer(server)}
                        onRestart={() => setRestartServer(server)}
                        onDrainUndrain={() => actionMutation.mutate({ serverId: server.id, type: server.is_draining ? "undrain" : "drain" })}
                        onDelete={() => setDeleteServer(server)}
                      />
                    )))}
              </tbody>
            </table>
          </TableContainer>
          <ServerRowDrawer
            server={visibleItems.find((s) => s.id === selectedServerId) ?? null}
            onClose={() => setSelectedServerId(null)}
            peerCount={selectedServerId ? (devicesByServer.get(selectedServerId) ?? 0) : 0}
            onRestart={setRestartServer}
            telemetrySnapshot={selectedServerId ? (snapshotSummary.data?.servers?.[selectedServerId] ?? null) : null}
          />
          <IssueConfigModal
            open={!!issueConfigServer}
            onClose={() => setIssueConfigServer(null)}
            server={issueConfigServer}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY })}
          />
          {regionFilter === "all" && data && data.total > LIMIT ? (
            <Pagination
              offset={(pageParam - 1) * LIMIT}
              limit={LIMIT}
              total={data.total}
              onPage={handlePageChange}
            />
          ) : null}
        </>
      ) : regionFilter === "all" && statusFilter === "all" && !searchTerm.trim() && data?.items?.length === 0 ? (
        data?.agent_mode_no_heartbeat ? (
          <EmptyState
            icon={<Server strokeWidth={1.5} />}
            title="No server with heartbeat"
            description="Agent mode: only servers that send a heartbeat are shown. Create a server (or run ./manage.sh seed-agent-server), set SERVER_ID to its id in your node-agent env, then start the node-agent. See docs/ops/agent-mode-one-server.md."
            actions={<ButtonLink to="/servers/new" variant="primary">Add Server</ButtonLink>}
          />
        ) : (
          <EmptyState
            icon={<Server strokeWidth={1.5} />}
            title="No servers yet"
            description="Get started by creating your first VPN server"
            actions={<ButtonLink to="/servers/new" variant="primary">Create Server</ButtonLink>}
          />
        )
      ) : (
        <p className="table-empty" data-testid="servers-empty">
          {regionFilter !== "all" || statusFilter !== "all" || searchTerm.trim()
            ? "No servers match filters"
            : "No servers found"}
        </p>
      )}
      </ErrorBoundary>
      </Panel>

      <ConfirmDanger
        open={!!deleteServer}
        onClose={() => setDeleteServer(null)}
        title="Delete server"
        message={
          deleteServer
            ? `Permanently remove ${deleteServer.name || `Node ${deleteServer.id.slice(0, 8)}`} (${deleteServer.region ?? "Unknown"})? This cannot be undone. Type the server name to confirm.`
            : ""
        }
        confirmTokenRequired
        confirmTokenLabel={`Type "${deleteServer?.name || deleteServer?.id.slice(0, 8) || ""}" to confirm`}
        onConfirm={(p) => {
          const expected = (deleteServer?.name || deleteServer?.id.slice(0, 8) || "").trim();
          if (p.confirm_token?.trim() !== expected) {
            addToast("Confirmation does not match. Type the server name exactly.", "error");
            return;
          }
          if (deleteServer) deleteMutation.mutate(deleteServer.id);
        }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteMutation.isPending}
      />

      <ConfirmDanger
        open={!!restartServer}
        onClose={() => setRestartServer(null)}
        title="Restart server"
        message={restartServer ? `Restart node ${restartServer.id.slice(0, 8)}? This may briefly disconnect peers.` : ""}
        reasonRequired
        reasonLabel="Reason (for audit)"
        reasonPlaceholder="e.g. Restart from admin"
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={handleConfirmRestart}
        confirmLabel="Restart"
        cancelLabel="Cancel"
        loading={restartMutation.isPending}
      />

      <Modal
        open={!!bulkAction}
        onClose={() => { setBulkAction(null); setBulkConfirmCode(""); }}
        title={bulkAction === "disable_provisioning" ? "Disable provisioning" : "Enable provisioning"}
        footer={(
          <>
            <Button
              variant="ghost"
              onClick={() => { setBulkAction(null); setBulkConfirmCode(""); }}
              disabled={bulkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmBulk}
              loading={bulkMutation.isPending}
              disabled={!bulkConfirmCode.trim()}
            >
              Confirm
            </Button>
          </>
        )}
      >
        <p className="modal-message">
          {bulkAction
            ? `This will ${bulkAction === "disable_provisioning" ? "disable" : "enable"} provisioning for ${selectedServerIds.size} server(s). Enter confirmation code.`
            : ""}
        </p>
        <HelperText variant="hint" className="mb-2">
          Use the value of RESTART_CONFIRM_TOKEN from your .env or runbook.
        </HelperText>
        <Input
          type="password"
          autoComplete="one-time-code"
          placeholder="Confirmation code"
          value={bulkConfirmCode}
          onChange={(e) => setBulkConfirmCode(e.target.value)}
          aria-label="Confirmation code"
        />
      </Modal>
    </div>
  );
}
