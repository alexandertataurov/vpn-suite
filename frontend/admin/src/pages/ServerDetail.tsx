import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { formatDateTime, formatBytes, formatRate, getErrorMessage } from "@vpn-suite/shared";
import { IconServer } from "@/design-system/icons";
import { Table, Button, Select, Skeleton, ConfirmDanger, useToast, PageError, RelativeTime, Tabs, Text, Heading, CodeText, PrimitiveStack, Card, PrimitiveBadge } from "@/design-system";
import { Alert, FormActions, MetricTile } from "@/design-system";
import { ButtonLink, IssueConfigModal, ServerLogsTab } from "@/components";
import { serverHealthBadge } from "../utils/statusBadges";
import { DetailPage } from "../templates/DetailPage";
import type {
  ServerOut,
  ServerPeersOut,
  ServerTelemetryOut,
  PeerOut,
  PeerListOut,
  PeerListItem,
  AdminRotatePeerResponse,
  AdminRevokePeerResponse,
  ActionListOut,
  ActionOut,
} from "@vpn-suite/shared/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  serverKey,
  serverTelemetryKey,
  serverPeersKey,
  peersKey,
  serverActionsKey,
} from "../api/query-keys";
import { api } from "../api/client";

export function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [blockPeer, setBlockPeer] = useState<PeerOut | null>(null);
  const [rotatePeer, setRotatePeer] = useState<PeerOut | null>(null);
  const [revokePeer, setRevokePeer] = useState<PeerOut | null>(null);
  const [resetPeer, setResetPeer] = useState<PeerOut | null>(null);
  const [issueConfigOpen, setIssueConfigOpen] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<"all" | "active" | "revoked">("all");
  type TabId = "overview" | "peers" | "telemetry" | "actions" | "logs" | "config";
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { data: server, isLoading: serverLoading, error: serverError } = useQuery<ServerOut>({
    queryKey: serverKey(id!),
    queryFn: ({ signal }) => api.get<ServerOut>(`/servers/${id}`, { signal }),
    enabled: !!id,
  });

  const { data: telemetry, isLoading: telemetryLoading } = useQuery<ServerTelemetryOut>({
    queryKey: serverTelemetryKey(id!),
    queryFn: ({ signal }) => api.get<ServerTelemetryOut>(`/servers/${id}/telemetry`, { signal }),
    enabled: !!id,
  });

  const { data: peersData, isLoading: peersLoading } = useQuery<ServerPeersOut>({
    queryKey: serverPeersKey(id!),
    queryFn: ({ signal }) => api.get<ServerPeersOut>(`/servers/${id}/peers`, { signal }),
    enabled: !!id,
    refetchInterval: activeTab === "peers" ? 3000 : false,
  });

  const peerPrevRef = useRef<Map<string, { ts: number; rx: number; tx: number }>>(new Map());
  const [peerRates, setPeerRates] = useState<Map<string, { rxBps: number; txBps: number }>>(new Map());
  useEffect(() => {
    if (!peersData?.peers?.length) return;
    const now = Date.now() / 1000;
    const prev = peerPrevRef.current;
    const nextRates = new Map<string, { rxBps: number; txBps: number }>();
    for (const p of peersData.peers) {
      const rx = p.rx_bytes ?? p.traffic_bytes ?? 0;
      const tx = p.tx_bytes ?? 0;
      const last = prev.get(p.public_key);
      if (last && now > last.ts) {
        const dt = now - last.ts;
        if (dt > 0) {
          nextRates.set(p.public_key, {
            rxBps: (rx - last.rx) / dt,
            txBps: (tx - last.tx) / dt,
          });
        }
      }
      prev.set(p.public_key, { ts: now, rx, tx });
    }
    const keys = new Set(peersData.peers.map((p) => p.public_key));
    for (const key of prev.keys()) if (!keys.has(key)) prev.delete(key);
    if (nextRates.size) setPeerRates((m) => new Map([...m, ...nextRates]));
  }, [peersData]);

  const blockMutation = useMutation({
    mutationFn: ({ public_key: pk, confirm_token }: { public_key: string; confirm_token: string }) =>
      api.post(`/servers/${id}/peers/block`, { public_key: pk, confirm_token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serverPeersKey(id!) });
      queryClient.invalidateQueries({ queryKey: serverTelemetryKey(id!) });
      addToast("Peer blocked", "success");
      setBlockPeer(null);
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Block failed"), "error");
    },
  });

  const resetMutation = useMutation({
    mutationFn: (pk: string) => api.post(`/servers/${id}/peers/reset`, { public_key: pk }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serverPeersKey(id!) });
      queryClient.invalidateQueries({ queryKey: serverTelemetryKey(id!) });
      addToast("Peer reset", "success");
      setResetPeer(null);
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Reset failed"), "error");
    },
  });

  const { data: devicesData } = useQuery<PeerListOut>({
    queryKey: peersKey(id!),
    queryFn: ({ signal }) =>
      api.get<PeerListOut>(`/peers?node_id=${id}&limit=200`, { signal }),
    enabled: !!id,
  });

  const { data: actionsData, refetch: refetchActions } = useQuery<ActionListOut>({
    queryKey: serverActionsKey(id!),
    queryFn: ({ signal }) =>
      api.get<ActionListOut>(`/servers/${id}/actions?limit=20`, { signal }),
    enabled: !!id && activeTab === "actions",
  });

  const createActionMutation = useMutation({
    mutationFn: (type: string) =>
      api.post<{ action_id: string }>(`/servers/${id}/actions`, { type }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serverActionsKey(id!) });
      queryClient.invalidateQueries({ queryKey: serverKey(id!) });
      queryClient.invalidateQueries({ queryKey: serverPeersKey(id!) });
      queryClient.invalidateQueries({ queryKey: serverTelemetryKey(id!) });
      addToast(`Action ${data.action_id.slice(0, 8)}… queued`, "success");
      refetchActions();
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Action failed"), "error");
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (peerId: string) =>
      api.post<AdminRotatePeerResponse>(`/servers/${id}/peers/${peerId}/rotate`, {}),
    onSuccess: (data) => {
      setRotatePeer(null);
      queryClient.invalidateQueries({ queryKey: serverPeersKey(id!) });
      queryClient.invalidateQueries({ queryKey: peersKey(id!) });
      addToast(
        data.config_awg?.download_url || data.config_wg?.download_url
          ? "Keys rotated. Both configs ready."
          : "Keys rotated",
        "success"
      );
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Rotate failed"), "error");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (peerId: string) =>
      api.post<AdminRevokePeerResponse>(`/servers/${id}/peers/${peerId}/revoke`, {}),
    onSuccess: () => {
      setRevokePeer(null);
      queryClient.invalidateQueries({ queryKey: serverPeersKey(id!) });
      queryClient.invalidateQueries({ queryKey: peersKey(id!) });
      addToast("Peer revoked", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Revoke failed"), "error");
    },
  });

  const filteredPeers =
    peersData?.peers?.filter((p) => {
      if (filter === "all") return true;
      if (filter === "online") return p.status === "online";
      return p.status !== "online";
    }) ?? [];

  const deviceColumns = useMemo(() => [
    {
      key: "client_name",
      header: "Label",
      truncate: true,
      render: (r: PeerListItem) => r.client_name || "—",
    },
    {
      key: "user",
      header: "User",
      render: (r: PeerListItem) => (r.user_id === 0 ? "Standalone" : String(r.user_id)),
    },
    {
      key: "status",
      header: "Status",
      render: (r: PeerListItem) => r.status,
    },
    {
      key: "issued_at",
      header: "Issued",
      numeric: true,
      render: (r: PeerListItem) => formatDateTime(r.issued_at),
    },
    {
      key: "revoked_at",
      header: "Revoked",
      numeric: true,
      render: (r: PeerListItem) =>
        r.revoked_at ? formatDateTime(r.revoked_at) : "—",
    },
    {
      key: "actions",
      header: "",
      actions: true,
      render: (r: PeerListItem) =>
        r.status === "active" ? (
          <span className="ref-inline-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRotatePeer(r)}
              disabled={rotateMutation.isPending}
            >
              Rotate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevokePeer(r)}
              disabled={revokeMutation.isPending}
            >
              Revoke
            </Button>
          </span>
        ) : null,
    },
  ], [rotateMutation.isPending, revokeMutation.isPending]);

  const filteredDevices =
    devicesData?.peers?.filter((d) => {
      if (deviceFilter === "all") return true;
      if (deviceFilter === "active") return d.status === "active";
      return d.status === "revoked";
    }) ?? [];

  const columns = useMemo(() => {
    const issueLabels: Record<string, string> = {
      no_handshake: "No handshake",
      no_traffic: "No traffic",
      wrong_allowed_ips: "Wrong allowed_ips",
    };
    return [
    {
      key: "device_name",
      header: "Device",
      truncate: true,
      render: (r: PeerOut) => r.device_name || "—",
    },
    {
      key: "pubkey",
      header: "Public key",
      truncate: true,
      mono: true,
      render: (r: PeerOut) => (
        <CodeText title={r.public_key}>
          {r.public_key.slice(0, 20)}…
        </CodeText>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: PeerOut) => r.status,
    },
    {
      key: "handshake",
      header: "Last handshake",
      render: (r: PeerOut) => (r.last_handshake_ts ? <RelativeTime date={r.last_handshake_ts} /> : "—"),
    },
    {
      key: "rx",
      header: "RX",
      numeric: true,
      align: "right" as const,
      render: (r: PeerOut) => formatBytes(r.rx_bytes ?? r.traffic_bytes ?? null),
    },
    {
      key: "tx",
      header: "TX",
      numeric: true,
      align: "right" as const,
      render: (r: PeerOut) => formatBytes(r.tx_bytes ?? null),
    },
    {
      key: "rx_speed",
      header: "RX/s",
      numeric: true,
      align: "right" as const,
      render: (r: PeerOut) => formatRate(peerRates.get(r.public_key)?.rxBps),
    },
    {
      key: "tx_speed",
      header: "TX/s",
      numeric: true,
      align: "right" as const,
      render: (r: PeerOut) => formatRate(peerRates.get(r.public_key)?.txBps),
    },
    {
      key: "issues",
      header: "Issues",
      render: (r: PeerOut) =>
        r.issues?.length ? (
          <span className="ref-peer-issues">
            {(r.issues as string[]).map((i) => (
              <PrimitiveBadge key={i} variant="warning" title={issueLabels[i] ?? i}>
                {issueLabels[i] ?? i}
              </PrimitiveBadge>
            ))}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "",
      actions: true,
      render: (r: PeerOut) => (
        <span className="actions-row gap-xs">
          <Button variant="ghost" size="sm" onClick={() => setBlockPeer(r)} title="Block peer">
            Block
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setResetPeer(r)} title="Reset (remove) peer">
            Reset
          </Button>
        </span>
      ),
    },
  ];
  }, [peerRates]);

  if (serverError || !id) {
    return (
      <DetailPage className="ref-page" title="SERVER" backTo="/servers" backLabel="Servers" description="Node details and configuration">
        <PageError title="Server not found" message="This server may have been removed." />
      </DetailPage>
    );
  }

  if (serverLoading || !server) {
    return (
      <DetailPage className="ref-page" title="SERVER" backTo="/servers" backLabel="Servers" description="Node details and configuration">
        <Skeleton height={220} />
      </DetailPage>
    );
  }

  const healthBadge = serverHealthBadge(server.status);

  return (
    <DetailPage
      className="ref-page"
      data-testid="server-detail-page"
      title={`SERVER ${server.name ?? server.id.slice(0, 8)}`}
      backTo="/servers"
      backLabel="Servers"
      icon={IconServer}
      description="Node details, telemetry and peers"
      primaryAction={
        <>
          <Button variant="ghost" onClick={() => setIssueConfigOpen(true)}>
            Issue config
          </Button>
          <ButtonLink to={`/servers/${id}/edit`} variant="secondary">
            Edit
          </ButtonLink>
        </>
      }
    >
      <Tabs
        items={[
          { id: "overview", label: "Overview" },
          { id: "peers", label: "Peers" },
          { id: "telemetry", label: "Telemetry" },
          { id: "actions", label: "Actions" },
          { id: "logs", label: "Logs" },
          { id: "config", label: "Config" },
        ]}
        value={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        ariaLabel="Server sections"
        className="tabs tabs-page"
        tabClassName="tabs-page-item"
      />

      {activeTab === "overview" && (
        <Card as="section" variant="outline" id="server-tabpanel-overview" role="tabpanel" aria-labelledby="server-tab-overview">
          <PrimitiveStack gap="3">
            <div className="server-detail-meta">
              <PrimitiveBadge variant={healthBadge.variant}>{healthBadge.label}</PrimitiveBadge>
              {server.last_seen_at ? (
                <span>Last seen: <RelativeTime date={server.last_seen_at} /></span>
              ) : null}
              <span>{server.region ?? "—"}</span>
              <span>{server.is_active ? "Active" : "Inactive"}</span>
              {server.is_draining ? <span className="text-warning">Draining</span> : null}
            </div>
            {server.is_draining ? (
              <Alert variant="warning" title="Draining" message="This node is set to drain. New peers will not be assigned until undrained." />
            ) : null}
            {server.status === "degraded" ? (
              <Alert variant="warning" title="Degraded" message="Server health is degraded. Check telemetry and logs." />
            ) : null}
            {server.ops_notes ? (
              <div className="mt-md">
                <Heading level={4} className="ref-settings-title">Ops notes</Heading>
                <Text variant="muted" as="p">{server.ops_notes}</Text>
              </div>
            ) : null}
          </PrimitiveStack>
        </Card>
      )}

      {activeTab === "peers" && (
        <>
          <Card as="section" variant="outline" id="server-vpn-control" role="region" aria-label="VPN control">
            <Heading level={3} className="ref-settings-title">VPN control</Heading>
            <PrimitiveStack gap="2" className="ref-vpn-control-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => createActionMutation.mutate("apply_peers")}
                disabled={createActionMutation.isPending || peersData?.node_reachable === false}
                title="Queue apply_peers for node-agent; peers will sync from desired-state"
              >
                {createActionMutation.isPending ? "Queuing…" : "Sync peers (apply desired-state)"}
              </Button>
              <Text as="span" variant="muted" className="text-sm">
                Queues an action for the node to reconcile peers from admin-api. Refreshes after a few seconds.
              </Text>
            </PrimitiveStack>
          </Card>
          <Card as="section" variant="outline" id="server-tabpanel-peers" role="tabpanel" aria-labelledby="server-tab-peers">
            <div className="ref-peers-head">
              <Heading level={3} className="ref-settings-title">Peers</Heading>
              <FormActions>
                {peersData?.node_reachable === false ? (
                  <Text as="span" className="text-warning" role="alert">
                    Node unreachable
                  </Text>
                ) : null}
                <Select
                  label="Peer status"
                  options={[
                    { value: "all", label: "All" },
                    { value: "online", label: "Online" },
                    { value: "offline", label: "Offline" },
                  ]}
                  value={filter}
                  onChange={(v) => setFilter(v as "all" | "online" | "offline")}
                  aria-label="Filter peers by status"
                  className="w-auto"
                />
              </FormActions>
            </div>

            {peersLoading ? (
              <Skeleton height={200} />
            ) : (
              <Table<PeerOut>
                columns={columns}
                data={filteredPeers}
                keyExtractor={(r) => r.public_key}
                emptyMessage="No peers"
              />
            )}
          </Card>

          <Card as="section" variant="outline">
            <div className="ref-peers-head">
              <Heading level={3} className="ref-settings-title">Devices (issued)</Heading>
              <FormActions>
                <Select
                  label="Status"
                  options={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "revoked", label: "Revoked" },
                  ]}
                  value={deviceFilter}
                  onChange={(v) => setDeviceFilter(v as "all" | "active" | "revoked")}
                  aria-label="Filter devices"
                  className="w-auto"
                />
              </FormActions>
            </div>
            <Table<PeerListItem>
              columns={deviceColumns}
              data={filteredDevices}
              keyExtractor={(r) => r.peer_id}
              emptyMessage="No devices"
            />
          </Card>
        </>
      )}

      {activeTab === "telemetry" && (
        <Card as="section" variant="outline" id="server-tabpanel-telemetry" role="tabpanel" aria-labelledby="server-tab-telemetry">
          <Heading level={3} className="ref-settings-title">Telemetry</Heading>
          {telemetry?.node_reachable === false ? (
            <Text as="p" className="text-warning mb-md" role="alert">
              Node unreachable. Data may be from cache or unavailable.
            </Text>
          ) : null}
          {telemetryLoading ? (
            <Skeleton height={60} />
          ) : telemetry ? (
            <div className="ref-stats-grid">
              <MetricTile label="Peers" value={telemetry.peers_count} state="default" />
              <MetricTile label="Online" value={telemetry.online_count} state="success" />
              <MetricTile label="RX total" value={formatBytes(telemetry.total_rx_bytes ?? null)} state="default" />
              <MetricTile label="TX total" value={formatBytes(telemetry.total_tx_bytes ?? null)} state="default" />
              <MetricTile
                label="Last updated"
                value={telemetry.last_updated ? formatDateTime(telemetry.last_updated) : "—"}
                state="default"
              />
            </div>
          ) : (
            <Text variant="muted" as="p">N/A</Text>
          )}
        </Card>
      )}

      {activeTab === "actions" && (
        <Card as="section" variant="outline" id="server-tabpanel-actions" role="tabpanel" aria-labelledby="server-tab-actions">
          <div className="ref-peers-head">
            <Heading level={3} className="ref-settings-title">Actions</Heading>
            <FormActions>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => createActionMutation.mutate("sync")}
                disabled={createActionMutation.isPending}
              >
                Sync now
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => createActionMutation.mutate("apply_peers")}
                disabled={createActionMutation.isPending}
              >
                Reconcile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createActionMutation.mutate(server.is_draining ? "undrain" : "drain")}
                disabled={createActionMutation.isPending}
              >
                {server.is_draining ? "Undrain" : "Drain"}
              </Button>
            </FormActions>
          </div>
          {actionsData?.items?.length ? (
            <Table<ActionOut>
              columns={[
                { key: "type", header: "Type", render: (r) => r.type },
                { key: "status", header: "Status", render: (r) => r.status },
                {
                  key: "requested_at",
                  header: "Requested",
                  numeric: true,
                  render: (r) => formatDateTime(r.requested_at),
                },
                {
                  key: "finished_at",
                  header: "Finished",
                  numeric: true,
                  render: (r) => (r.finished_at ? formatDateTime(r.finished_at) : "—"),
                },
              ]}
              data={actionsData.items}
              keyExtractor={(r) => r.id}
              emptyMessage="No actions"
            />
          ) : (
            <Text variant="muted" as="p">No actions yet. Use Sync now or Reconcile to queue an action.</Text>
          )}
        </Card>
      )}

      {activeTab === "logs" && (
        <Card as="section" variant="outline" id="server-tabpanel-logs" role="tabpanel" aria-labelledby="server-tab-logs">
          <ServerLogsTab serverId={id!} />
        </Card>
      )}

      {activeTab === "config" && (
        <Card as="section" variant="outline" id="server-tabpanel-config" role="tabpanel" aria-labelledby="server-tab-config">
          <Heading level={3} className="ref-settings-title">Config / Profile</Heading>
          <Text variant="muted" as="p">View and apply server profile from Edit server.</Text>
        </Card>
      )}

      <ConfirmDanger
        open={!!blockPeer}
        onClose={() => setBlockPeer(null)}
        title="Block peer"
        message={blockPeer ? `Block peer ${blockPeer.public_key.slice(0, 16)}…?` : ""}
        confirmTokenRequired
        confirmTokenLabel="Confirmation code"
        onConfirm={(payload) => {
          if (blockPeer && payload.confirm_token) {
            blockMutation.mutate({ public_key: blockPeer.public_key, confirm_token: payload.confirm_token });
          }
        }}
        confirmLabel="Block"
        cancelLabel="Cancel"
        loading={blockMutation.isPending}
      />

      <ConfirmDanger
        open={!!rotatePeer}
        onClose={() => setRotatePeer(null)}
        title="Rotate device keys"
        message={rotatePeer ? `Rotate keys for peer ${rotatePeer.public_key.slice(0, 16)}…? The client will need a new config/QR.` : ""}
        reasonRequired={false}
        onConfirm={() => {
          if (rotatePeer?.peer_id) rotateMutation.mutate(rotatePeer.peer_id);
        }}
        confirmLabel="Rotate"
        cancelLabel="Cancel"
        loading={rotateMutation.isPending}
      />

      <ConfirmDanger
        open={!!revokePeer}
        onClose={() => setRevokePeer(null)}
        title="Revoke peer"
        message={revokePeer ? `Revoke peer ${revokePeer.public_key.slice(0, 16)}…? This will disconnect the device.` : ""}
        reasonRequired
        reasonLabel="Reason (for audit)"
        reasonPlaceholder="e.g. Device lost"
        onConfirm={() => {
          if (revokePeer?.peer_id) revokeMutation.mutate(revokePeer.peer_id);
        }}
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        loading={revokeMutation.isPending}
      />

      <ConfirmDanger
        open={!!resetPeer}
        onClose={() => setResetPeer(null)}
        title="Reset peer"
        message={resetPeer ? `Remove peer ${resetPeer.public_key.slice(0, 16)}…?` : ""}
        reasonRequired={false}
        onConfirm={() => {
          if (resetPeer) resetMutation.mutate(resetPeer.public_key);
        }}
        confirmLabel="Reset"
        cancelLabel="Cancel"
        loading={resetMutation.isPending}
      />

      <IssueConfigModal
        open={issueConfigOpen}
        onClose={() => setIssueConfigOpen(false)}
        server={server ?? null}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: serverPeersKey(id!) });
          queryClient.invalidateQueries({ queryKey: serverTelemetryKey(id!) });
        }}
      />
    </DetailPage>
  );
}
