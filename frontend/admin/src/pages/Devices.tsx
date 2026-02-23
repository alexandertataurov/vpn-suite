import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { PrimitiveBadge, Table, Input, Select, Button, Checkbox, DeviceCard, ConfirmDanger, useToast, PageError, BulkActionsBar } from "@vpn-suite/shared/ui";
import { formatDate, getErrorMessage } from "@vpn-suite/shared";
import { ConfigContentModal } from "../components/ConfigContentModal";
import { PageHeader } from "../components/PageHeader";
import { TableSection } from "../components/TableSection";
import { Toolbar } from "../components/Toolbar";
import type { DeviceOut, DeviceList, IssuedConfigOut } from "@vpn-suite/shared/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { DEVICES_KEY } from "../api/query-keys";
import { useServerListForRegion } from "../hooks/useServerList";
import {
  loadSavedViews,
  removeSavedView,
  type SavedView,
  upsertSavedView,
} from "../utils/savedViews";

const LIMIT = 20;
const DEVICES_VIEWS_SCOPE = "devices";
type ViewMode = "cards" | "table";

function configLabel(c: IssuedConfigOut): string {
  const used = c.consumed_at ? "used" : "pending";
  const date = c.created_at ? formatDate(c.created_at) : "";
  return `${c.profile_type} • ${used} • ${date}`;
}

function ConfigsCell({
  configs,
  onShow,
}: {
  configs: IssuedConfigOut[];
  onShow: (id: string, label: string) => void;
}) {
  if (!configs.length) return "—";
  return (
    <span className="ref-configs-cell">
      {configs.length} ({configs.filter((c) => c.consumed_at).length} used)
      {configs.map((c) => (
        <Button
          key={c.id}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onShow(c.id, configLabel(c))}
        >
          Show
        </Button>
      ))}
    </span>
  );
}

interface DevicesViewState {
  userId: string;
  email: string;
  statusFilter: "all" | "active" | "revoked";
  viewMode: ViewMode;
}

export function DevicesPage() {
  const [offset, setOffset] = useState(0);
  const [searchParams] = useSearchParams();
  const userParam = searchParams.get("user_id") ?? "";
  const [userId, setUserId] = useState(userParam);
  useEffect(() => {
    setUserId(userParam);
  }, [userParam]);
  const [email, setEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [savedViews, setSavedViews] = useState<SavedView<DevicesViewState>[]>(() =>
    loadSavedViews<DevicesViewState>(DEVICES_VIEWS_SCOPE)
  );
  const [selectedViewName, setSelectedViewName] = useState("");
  const [configModal, setConfigModal] = useState<{ id: string; label: string } | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [bulkRevokeOpen, setBulkRevokeOpen] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const regionFilter = searchParams.get("region") ?? "all";
  const queryLimit = regionFilter === "all" ? LIMIT : 200;

  const { data, error, refetch } = useQuery<DeviceList>({
    queryKey: [...DEVICES_KEY, offset, searchTrigger, regionFilter, userId],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(queryLimit),
        offset: String(regionFilter === "all" ? offset : 0),
      });
      if (userId) params.set("user_id", userId);
      if (email) params.set("email", email);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api.get<DeviceList>(`/devices?${params.toString()}`, { signal });
    },
  });

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

  const revokeMutation = useMutation({
    mutationFn: ({ deviceId, confirm_token }: { deviceId: string; confirm_token: string }) =>
      api.post(`/devices/${deviceId}/revoke`, { confirm_token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      addToast("Device revoked", "success");
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
      addToast(`Bulk revoke: ${res.revoked} revoked, ${res.skipped} skipped`, "success");
      setBulkRevokeOpen(false);
      setSelectedDeviceIds(new Set());
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Bulk revoke failed"), "error");
    },
  });

  const toggleDeviceSelection = (id: string) => {
    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSearchTrigger((n) => n + 1);
  };

  const applySavedView = (name: string) => {
    setSelectedViewName(name);
    if (!name) return;
    const selected = savedViews.find((view) => view.name === name);
    if (!selected) return;
    setUserId(selected.state.userId);
    setEmail(selected.state.email);
    setStatusFilter(selected.state.statusFilter);
    setViewMode(selected.state.viewMode);
    setOffset(0);
    setSearchTrigger((n) => n + 1);
  };

  const saveCurrentView = () => {
    const suggested = selectedViewName || "New devices view";
    const name = window.prompt("Save devices view as:", suggested)?.trim() ?? "";
    if (!name) return;
    const next = upsertSavedView<DevicesViewState>(DEVICES_VIEWS_SCOPE, savedViews, {
      name,
      state: { userId, email, statusFilter, viewMode },
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

  const columns = [
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
      key: "id",
      header: "ID",
      truncate: true,
      mono: true,
      titleTooltip: (r: DeviceOut) => r.id,
      render: (r: DeviceOut) => r.id.slice(0, 8),
    },
    {
      key: "user_id",
      header: "User ID",
      truncate: true,
      mono: true,
      titleTooltip: (r: DeviceOut) => String(r.user_id),
      render: (r: DeviceOut) => r.user_id,
    },
    {
      key: "device_name",
      header: "Name",
      truncate: true,
      titleTooltip: (r: DeviceOut) => r.device_name ?? undefined,
      render: (r: DeviceOut) => r.device_name ?? "—",
    },
    { key: "status", header: "Status", render: (r: DeviceOut) => (r.revoked_at ? "Revoked" : "Active") },
    {
      key: "issued_configs",
      header: "Configs issued",
      numeric: true,
      render: (r: DeviceOut) => (
        <span className="ref-configs-cell">
          <ConfigsCell
            configs={r.issued_configs ?? []}
            onShow={(id, label) => setConfigModal({ id, label })}
          />
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      render: (r: DeviceOut) =>
        !r.revoked_at ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => revokeMutation.mutate({ deviceId: r.id, confirm_token: "confirm_revoke" })}
            disabled={revokeMutation.isPending}
          >
            Revoke
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="ref-page" data-testid="devices-page">
      <PageHeader
        icon={Smartphone}
        title="Devices"
        description="Issued configs and revocation state"
      >
        {regionFilter !== "all" ? <PrimitiveBadge variant="info">Region: {regionFilter}</PrimitiveBadge> : null}
      </PageHeader>

      <TableSection
        pagination={regionFilter === "all" && data && data.total > LIMIT ? { offset, limit: LIMIT, total: data.total, onPage: setOffset } : undefined}
      >
        <form onSubmit={handleSearch}>
          <Toolbar className="ref-toolbar-spaced">
            <Input
              placeholder="User ID"
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              aria-label="User ID"
            />
            <Input
              placeholder="or Email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            <Select
              label="Status"
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "revoked", label: "Revoked" },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as "all" | "active" | "revoked")}
              aria-label="Filter devices by status"
              className="w-auto"
            />
            <Button type="submit">Load devices</Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={selectedDeviceIds.size === 0}
              onClick={() => setBulkRevokeOpen(true)}
            >
              Bulk revoke ({selectedDeviceIds.size})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
            >
              {viewMode === "cards" ? "Table" : "Cards"}
            </Button>
          </Toolbar>
        </form>
        {selectedDeviceIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedDeviceIds.size}
            onClear={() => setSelectedDeviceIds(new Set())}
            actions={
              <Button variant="danger" size="sm" onClick={() => setBulkRevokeOpen(true)}>
                Revoke
              </Button>
            }
          />
        )}
        <div className="ref-users-views ref-toolbar-spaced">
          <label htmlFor="devices-view-select" className="ref-users-view-label">Saved views</label>
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
        </div>
        {viewMode === "cards" && scopedDevices.length ? (
          <ul className="device-card-list">
            {scopedDevices.map((d) => {
              const configs = d.issued_configs ?? [];
              const used = configs.filter((c) => c.consumed_at).length;
              return (
                <li key={d.id}>
                  <DeviceCard
                    id={d.id}
                    name={d.device_name}
                    status={d.revoked_at ? "revoked" : "active"}
                    issuedAt={d.issued_at}
                    shortId={d.id.slice(0, 8)}
                    secondaryActions={
                      !d.revoked_at ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeMutation.mutate({ deviceId: d.id, confirm_token: "confirm_revoke" })}
                          disabled={revokeMutation.isPending}
                        >
                          Revoke
                        </Button>
                      ) : undefined
                    }
                  />
                  {configs.length > 0 ? (
                    <p className="ref-device-configs text-muted">
                      Configs issued: {configs.length} ({used} used).{" "}
                      {configs.map((c) => (
                        <Button
                          key={c.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfigModal({ id: c.id, label: configLabel(c) })}
                        >
                          Show
                        </Button>
                      ))}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <Table
            columns={columns}
            data={scopedDevices}
            keyExtractor={(r) => r.id}
            emptyMessage="No devices found"
          />
        )}
      </TableSection>
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
      <ConfigContentModal
        open={!!configModal}
        onClose={() => setConfigModal(null)}
        issuedConfigId={configModal?.id ?? null}
        label={configModal?.label}
      />
    </div>
  );
}
