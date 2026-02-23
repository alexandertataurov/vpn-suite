import { useState } from "react";
import { formatDateTime, formatBytes, getErrorMessage } from "@vpn-suite/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MapPin, Power, Settings } from "lucide-react";
import { Button, Drawer, Skeleton, useToast, RelativeTime, Text, Heading } from "@vpn-suite/shared/ui";
import { ButtonLink } from "./ButtonLink";
import type {
  ServerOut,
  ServerIpListOut,
  ServerSnapshotSummaryEntry,
  ServerTelemetryOut,
} from "@vpn-suite/shared/types";
import type { AuditLogList } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import {
  SERVERS_LIST_KEY,
  serversIpsKey,
  serversTelemetryKey,
  auditServerKey,
} from "../api/query-keys";

function resolveHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return endpoint;
  }
}

type ServerVisualStatus = "online" | "offline" | "maintenance";

function getServerVisualStatus(server: ServerOut): ServerVisualStatus {
  if (!server.is_active) return "offline";
  const status = (server.status ?? "unknown").toLowerCase();
  if (status === "offline") return "offline";
  if (status === "degraded" || status === "unknown") return "maintenance";
  return "online";
}

export interface ServerRowDrawerProps {
  server: ServerOut | null;
  onClose: () => void;
  peerCount?: number;
  onRestart?: (server: ServerOut) => void;
  telemetrySnapshot?: ServerSnapshotSummaryEntry | null;
}

type DrawerTab = "overview" | "ips" | "telemetry" | "activity";

export function ServerRowDrawer({ server, onClose, peerCount = 0, onRestart, telemetrySnapshot }: ServerRowDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const serverId = server?.id ?? "";
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const ipsQuery = useQuery<ServerIpListOut>({
    queryKey: serversIpsKey(serverId),
    queryFn: ({ signal }) => api.get<ServerIpListOut>(`/servers/${serverId}/ips`, { signal }),
    enabled: !!serverId,
  });
  const telemetryQuery = useQuery<ServerTelemetryOut>({
    queryKey: serversTelemetryKey(serverId),
    queryFn: ({ signal }) => api.get<ServerTelemetryOut>(`/servers/${serverId}/telemetry`, { signal }),
    enabled: !!serverId,
  });
  const auditQuery = useQuery<AuditLogList>({
    queryKey: auditServerKey(serverId),
    queryFn: ({ signal }) =>
      api.get<AuditLogList>(`/audit?resource_type=server&resource_id=${encodeURIComponent(serverId)}&limit=20&offset=0`, {
        signal,
      }),
    enabled: !!serverId && activeTab === "activity",
  });
  const autoSyncMutation = useMutation({
    mutationFn: (payload: { auto_sync_enabled: boolean; auto_sync_interval_sec?: number }) =>
      api.patch<ServerOut>(`/servers/${serverId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVERS_LIST_KEY });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Auto-sync update failed"), "error");
    },
  });

  if (!server) return null;

  const visualStatus = getServerVisualStatus(server);
  const statusLabel = visualStatus.charAt(0).toUpperCase() + visualStatus.slice(1);
  const maxUsers = Math.max(50, Math.ceil((peerCount + 10) / 10) * 10);

  const copyId = () => {
    if (serverId && typeof navigator?.clipboard !== "undefined") {
      navigator.clipboard.writeText(serverId);
      addToast("Server ID copied", "success");
    }
  };

  const tabs: { id: DrawerTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "ips", label: "IPs" },
    { id: "telemetry", label: "Telemetry" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <Drawer open={!!server} onClose={onClose} title={server.name || `Node ${server.id.slice(0, 8)}`} width={440}>
      <div className="server-drawer-content">
        <div className="server-drawer-header-actions">
          <Button variant="ghost" size="sm" onClick={copyId} aria-label="Copy server ID">
            Copy ID
          </Button>
          <ButtonLink
            to={`/servers/${server.id}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
          >
            <ExternalLink aria-hidden strokeWidth={1.5} className="server-drawer-icon-sm" />
            Open in new tab
          </ButtonLink>
        </div>
        <div className="server-drawer-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`server-drawer-tab ${activeTab === t.id ? "server-drawer-tab-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === "overview" && (
          <>
            <p className="server-drawer-status">
              <span className={`ref-server-status ${visualStatus}`}>{statusLabel}</span>
            </p>
            <dl className="server-drawer-meta">
              <dt>Region</dt>
              <dd>
                <MapPin aria-hidden strokeWidth={1.5} className="server-drawer-icon-inline" />
                {server.region ?? "Unknown"}
              </dd>
          <dt>API endpoint</dt>
          <dd className="ref-server-mono">{server.api_endpoint ? resolveHost(server.api_endpoint) : "—"}</dd>
              <dt>VPN Endpoint</dt>
              <dd>{server.vpn_endpoint ? resolveHost(server.vpn_endpoint) : "—"}</dd>
              <dt>Last seen</dt>
              <dd>
                {server.last_seen_at ? <RelativeTime date={server.last_seen_at} /> : "No data"}
              </dd>
              <dt>Last sync</dt>
              <dd>
                {server.last_snapshot_at ? <RelativeTime date={server.last_snapshot_at} /> : "—"}
              </dd>
              <dt>Peers / capacity</dt>
              <dd>{peerCount} / {maxUsers}</dd>
            </dl>
            <section className="server-drawer-auto-sync" aria-label="Auto-sync">
              <Heading level={4} className="server-drawer-heading-auto-sync">Auto-sync</Heading>
              {server.is_active ? (
                <>
                  <p className="server-drawer-sync-text">On (always-on for active servers)</p>
                  <label className="server-drawer-sync-label">
                    <Text variant="muted" as="span">Interval (seconds)</Text>
                  </label>
                  <select
                    value={server.auto_sync_interval_sec ?? 60}
                    disabled={autoSyncMutation.isPending}
                    onChange={(e) =>
                      autoSyncMutation.mutate({
                        auto_sync_enabled: true,
                        auto_sync_interval_sec: Number(e.target.value),
                      })
                    }
                    data-testid="auto-sync-interval"
                  >
                    {[15, 30, 60, 120].map((s) => (
                      <option key={s} value={s}>
                        {s}s
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <p className="server-drawer-sync-text">
                    {server.auto_sync_enabled
                      ? `On (every ${server.auto_sync_interval_sec ?? 60}s)`
                      : "Off"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={autoSyncMutation.isPending}
                    onClick={() =>
                      autoSyncMutation.mutate({
                        auto_sync_enabled: !server.auto_sync_enabled,
                        auto_sync_interval_sec: server.auto_sync_interval_sec ?? 60,
                      })
                    }
                  >
                    {server.auto_sync_enabled ? "Turn off" : "Turn on"}
                  </Button>
                </>
              )}
            </section>
            <div className="server-drawer-actions">
              <ButtonLink to={`/servers/${server.id}/edit`} variant="secondary">
                <Settings aria-hidden strokeWidth={1.5} className="server-drawer-icon-md" />
                Configure
              </ButtonLink>
              {onRestart && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onRestart(server)}
                >
                  <Power aria-hidden strokeWidth={1.5} className="server-drawer-icon-md" />
                  {server.is_active ? "Restart" : "Start"}
                </Button>
              )}
            </div>
          </>
        )}
        {activeTab === "ips" && (
          <section aria-label="IP addresses">
            <Heading level={4} className="server-drawer-heading-section">IP addresses</Heading>
            {ipsQuery.isLoading && <Skeleton height={24} width="80%" />}
            {ipsQuery.data?.items?.length ? (
              <ul className="server-drawer-list">
                {ipsQuery.data.items.map((ip) => (
                  <li key={ip.id} className="ref-server-mono server-drawer-list-item">
                    {ip.ip} <Text variant="muted" as="span">({ip.role}, {ip.state})</Text>
                  </li>
                ))}
              </ul>
            ) : ipsQuery.data && !ipsQuery.isLoading ? (
              <Text variant="muted" as="p">No IPs configured</Text>
            ) : null}
          </section>
        )}
        {activeTab === "telemetry" && (
          <section aria-label="Telemetry">
            <Heading level={4} className="server-drawer-heading-section">Telemetry</Heading>
            {telemetryQuery.data?.source === "agent" && (
              <dl className="server-drawer-meta">
                <dt>Agent</dt>
                <dd>
                  Container: {telemetryQuery.data.container_name || "—"} · Agent v{telemetryQuery.data.agent_version || "—"}
                  {telemetryQuery.data.reported_status && (
                    <Text variant="muted" as="span" className="server-drawer-inline-gap">
                      · {telemetryQuery.data.reported_status}
                    </Text>
                  )}
                </dd>
                {((telemetryQuery.data.total_rx_bytes ?? 0) > 0 || (telemetryQuery.data.total_tx_bytes ?? 0) > 0) && (
                  <>
                    <dt>Traffic</dt>
                    <dd className="ref-server-mono">
                      RX {formatBytes(telemetryQuery.data.total_rx_bytes ?? 0)} · TX {formatBytes(telemetryQuery.data.total_tx_bytes ?? 0)}
                    </dd>
                  </>
                )}
              </dl>
            )}
            {(telemetrySnapshot?.cpu_pct != null || telemetrySnapshot?.ram_pct != null) && (
              <dl className="server-drawer-meta">
                <dt>Resources</dt>
                <dd>
                  {telemetrySnapshot?.cpu_pct != null && `CPU ${Number(telemetrySnapshot.cpu_pct).toFixed(0)}%`}
                  {telemetrySnapshot?.cpu_pct != null && telemetrySnapshot?.ram_pct != null && " · "}
                  {telemetrySnapshot?.ram_pct != null && `RAM ${Number(telemetrySnapshot.ram_pct).toFixed(0)}%`}
                </dd>
              </dl>
            )}
            {telemetrySnapshot?.health_score != null && (
              <dl className="server-drawer-meta">
                <dt>Health score</dt>
                <dd>{Math.round(Number(telemetrySnapshot.health_score))}%</dd>
              </dl>
            )}
            {!telemetryQuery.data && !telemetrySnapshot?.cpu_pct && !telemetrySnapshot?.ram_pct && (
              <Text variant="muted" as="p">No telemetry data available</Text>
            )}
          </section>
        )}
        {activeTab === "activity" && (
          <section aria-label="Activity">
            <Heading level={4} className="server-drawer-heading-section">Recent activity</Heading>
            {auditQuery.isLoading && <Skeleton height={24} width="80%" />}
            {auditQuery.data?.items?.length ? (
              <ul className="dashboard-audit-list server-drawer-audit-list">
                {auditQuery.data.items.map((entry) => (
                  <li key={entry.id} className="server-drawer-audit-item">
                    <Text variant="caption" as="span">
                      {formatDateTime(entry.created_at)}
                    </Text>
                    <span className="server-drawer-inline-gap-lg">{entry.action}</span>
                    {entry.admin_id && (
                      <Text variant="caption" as="span" className="server-drawer-inline-gap-lg">
                        by {entry.admin_id}
                      </Text>
                    )}
                  </li>
                ))}
              </ul>
            ) : auditQuery.data && !auditQuery.isLoading ? (
              <Text variant="muted" as="p">No activity recorded</Text>
            ) : null}
          </section>
        )}
      </div>
    </Drawer>
  );
}
