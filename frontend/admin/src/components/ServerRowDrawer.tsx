import { useState } from "react";
import { formatDateTime, formatBytes, getErrorMessage } from "@vpn-suite/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconTelemetry,
  IconCopy,
  IconLink,
  IconMapPin,
  IconPower,
  IconSettings,
} from "@/design-system/icons";
import { Button, Modal, Skeleton, useToast, RelativeTime, Text, Heading, PrimitiveBadge } from "@/design-system";
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
  serverTelemetryKey,
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
    queryKey: serverTelemetryKey(serverId),
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

  const statusBadgeVariant = visualStatus === "online" ? "success" : visualStatus === "maintenance" ? "warning" : "neutral";

  const footer = (
    <div className="server-modal-footer-actions">
      <ButtonLink to={`/servers/${server.id}/edit`} variant="secondary">
        <IconSettings aria-hidden size={14} strokeWidth={1.5} /> Configure
      </ButtonLink>
      {onRestart && (
        <Button variant="primary" size="sm" onClick={() => onRestart(server)}>
          <IconPower aria-hidden size={14} strokeWidth={1.5} /> {server.is_active ? "Restart" : "Start"}
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      open={!!server}
      onClose={onClose}
      title={server.name || `Node ${server.id.slice(0, 8)}`}
      footer={footer}
      className="server-detail-modal"
    >
      <div className="server-modal-content">
        <div className="server-modal-actions-bar">
          <Button variant="ghost" size="sm" onClick={copyId} aria-label="Copy server ID">
            <IconCopy aria-hidden size={14} strokeWidth={1.5} /> Copy ID
          </Button>
          <ButtonLink
            to={`/servers/${server.id}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="sm"
          >
            <IconLink aria-hidden size={14} strokeWidth={1.5} /> Open full detail
          </ButtonLink>
        </div>
        <div className="server-modal-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`server-modal-tab ${activeTab === t.id ? "server-modal-tab-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTab === "overview" && (
          <div className="server-modal-overview">
            <div className="server-modal-stats-grid">
              <div className="ref-stat-card server-modal-stat-card">
                <div className="ref-stat-label-row">
                  <span className="ref-stat-label">Status</span>
                </div>
                <p className="ref-stat-value">
                  <PrimitiveBadge variant={statusBadgeVariant} size="sm">{statusLabel}</PrimitiveBadge>
                </p>
              </div>
              <div className="ref-stat-card server-modal-stat-card">
                <div className="ref-stat-label-row">
                  <IconMapPin aria-hidden size={12} strokeWidth={1.5} className="ref-stat-icon" />
                  <span className="ref-stat-label">Region</span>
                </div>
                <p className="ref-stat-value">{server.region ?? "Unknown"}</p>
              </div>
              <div className="ref-stat-card server-modal-stat-card">
                <div className="ref-stat-label-row">
                  <span className="ref-stat-label">Last seen</span>
                </div>
                <p className="ref-stat-value">
                  {server.last_seen_at ? <RelativeTime date={server.last_seen_at} /> : "No data"}
                </p>
              </div>
              <div className="ref-stat-card server-modal-stat-card">
                <div className="ref-stat-label-row">
                  <span className="ref-stat-label">Peers</span>
                </div>
                <p className="ref-stat-value">{peerCount} <span className="ref-stat-meta">/ {maxUsers}</span></p>
              </div>
            </div>
            <div className="data-card server-modal-section">
              <div className="data-card__header">
                <span className="data-card__title">Endpoints</span>
              </div>
              <div className="data-card__body server-modal-endpoints">
                <div className="server-modal-meta-row">
                  <span>API</span>
                  <span className="ref-server-mono">{server.api_endpoint ? resolveHost(server.api_endpoint) : "—"}</span>
                </div>
                <div className="server-modal-meta-row">
                  <span>VPN</span>
                  <span className="ref-server-mono">{server.vpn_endpoint ? resolveHost(server.vpn_endpoint) : "—"}</span>
                </div>
                <div className="server-modal-meta-row">
                  <span>Last sync</span>
                  <span>{server.last_snapshot_at ? <RelativeTime date={server.last_snapshot_at} /> : "—"}</span>
                </div>
              </div>
            </div>
            <section className="data-card server-modal-section" aria-label="Auto-sync">
              <div className="data-card__header">
                <Heading level={4} className="data-card__title server-modal-title">Auto-sync</Heading>
              </div>
              <div className="data-card__body">
                {server.is_active ? (
                  <>
                    <Text variant="muted" as="p" className="server-modal-subtext">On (always-on for active servers)</Text>
                    <label className="server-modal-sync-label">
                      <Text variant="muted" as="span">Interval</Text>
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
                      className="server-modal-select"
                    >
                      {[15, 30, 60, 120].map((s) => (
                        <option key={s} value={s}>{s}s</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <Text variant="muted" as="p" className="server-modal-subtext">
                      {server.auto_sync_enabled ? `On (every ${server.auto_sync_interval_sec ?? 60}s)` : "Off"}
                    </Text>
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
              </div>
            </section>
          </div>
        )}
        {activeTab === "ips" && (
          <section className="data-card server-modal-section" aria-label="IP addresses">
            <div className="data-card__header">
              <Heading level={4} className="data-card__title server-modal-title">IP addresses</Heading>
            </div>
            <div className="data-card__body">
              {ipsQuery.isLoading && <Skeleton height={24} width="80%" />}
              {ipsQuery.data?.items?.length ? (
                <ul className="server-modal-list">
                  {ipsQuery.data.items.map((ip) => (
                    <li key={ip.id} className="ref-server-mono server-modal-list-item">
                      {ip.ip} <Text variant="muted" as="span">({ip.role}, {ip.state})</Text>
                    </li>
                  ))}
                </ul>
              ) : ipsQuery.data && !ipsQuery.isLoading ? (
                <Text variant="muted" as="p">No IPs configured</Text>
              ) : null}
            </div>
          </section>
        )}
        {activeTab === "telemetry" && (
          <section className="data-card server-modal-section" aria-label="Telemetry">
            <div className="data-card__header">
              <IconTelemetry aria-hidden size={14} strokeWidth={1.5} className="server-modal-telemetry-icon" />
              <Heading level={4} className="data-card__title server-modal-title">Telemetry</Heading>
            </div>
            <div className="data-card__body">
              {telemetryQuery.data?.source === "agent" && (
                <div className="server-modal-telemetry-block">
                  <div className="server-modal-meta-row">
                    <span>Agent</span>
                    <span>Container: {telemetryQuery.data.container_name || "—"} · v{telemetryQuery.data.agent_version || "—"}
                      {telemetryQuery.data.reported_status && (
                        <Text variant="muted" as="span" className="server-modal-meta-sep">· {telemetryQuery.data.reported_status}</Text>
                      )}
                    </span>
                  </div>
                  {((telemetryQuery.data.total_rx_bytes ?? 0) > 0 || (telemetryQuery.data.total_tx_bytes ?? 0) > 0) && (
                    <div className="server-modal-meta-row">
                      <span>Traffic</span>
                      <span className="ref-server-mono">
                        RX {formatBytes(telemetryQuery.data.total_rx_bytes ?? 0)} · TX {formatBytes(telemetryQuery.data.total_tx_bytes ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {(telemetrySnapshot?.cpu_pct != null || telemetrySnapshot?.ram_pct != null) && (
                <div className="server-modal-meta-row">
                  <span>Resources</span>
                  <span>
                    {telemetrySnapshot?.cpu_pct != null && `CPU ${Number(telemetrySnapshot.cpu_pct).toFixed(0)}%`}
                    {telemetrySnapshot?.cpu_pct != null && telemetrySnapshot?.ram_pct != null && " · "}
                    {telemetrySnapshot?.ram_pct != null && `RAM ${Number(telemetrySnapshot.ram_pct).toFixed(0)}%`}
                  </span>
                </div>
              )}
              {telemetrySnapshot?.health_score != null && (
                <div className="server-modal-meta-row">
                  <span>Health score</span>
                  <span>{Math.round(Number(telemetrySnapshot.health_score))}%</span>
                </div>
              )}
              {!telemetryQuery.data && !telemetrySnapshot?.cpu_pct && !telemetrySnapshot?.ram_pct && (
                <Text variant="muted" as="p">No telemetry data available</Text>
              )}
            </div>
          </section>
        )}
        {activeTab === "activity" && (
          <section className="data-card server-modal-section" aria-label="Activity">
            <div className="data-card__header">
              <Heading level={4} className="data-card__title server-modal-title">Recent activity</Heading>
            </div>
            <div className="data-card__body">
              {auditQuery.isLoading && <Skeleton height={24} width="80%" />}
              {auditQuery.data?.items?.length ? (
                <ul className="server-modal-audit-list">
                  {auditQuery.data.items.map((entry) => (
                    <li key={entry.id} className="server-modal-audit-item">
                      <Text variant="caption" as="span">{formatDateTime(entry.created_at)}</Text>
                      <span className="server-modal-audit-action">{entry.action}</span>
                      {entry.admin_id && (
                        <Text variant="caption" as="span" className="server-modal-audit-action">by {entry.admin_id}</Text>
                      )}
                    </li>
                  ))}
                </ul>
              ) : auditQuery.data && !auditQuery.isLoading ? (
                <Text variant="muted" as="p">No activity recorded</Text>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
