import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Panel, Button, Table, PageError, Skeleton, Modal, ConfirmDanger, Input, useToast, PrimitiveBadge } from "@vpn-suite/shared/ui";
import type {
  OutlineStatusOut,
  OutlineKeyListOut,
  OutlineKeyOut,
  OutlineDownloadTokenOut,
  OutlineServerOut,
  OutlineMetricsOut,
} from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import {
  OUTLINE_STATUS_KEY,
  OUTLINE_KEYS_KEY,
  OUTLINE_SERVER_KEY,
  OUTLINE_METRICS_KEY,
} from "../api/query-keys";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { formatBytes, formatDateTime, getErrorMessage } from "@vpn-suite/shared";
import { TableSection } from "../components/TableSection";

export function OutlineIntegrationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLimitBytes, setCreateLimitBytes] = useState("");
  const [renameKey, setRenameKey] = useState<OutlineKeyOut | null>(null);
  const [renameName, setRenameName] = useState("");
  const [revokeKey, setRevokeKey] = useState<OutlineKeyOut | null>(null);
  const [qrKeyId, setQrKeyId] = useState<string | null>(null);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [serverLimitModal, setServerLimitModal] = useState(false);
  const [serverLimitBytes, setServerLimitBytes] = useState("");
  const [serverPortModal, setServerPortModal] = useState(false);
  const [serverPort, setServerPort] = useState("");
  const [keyLimitModal, setKeyLimitModal] = useState<OutlineKeyOut | null>(null);
  const [keyLimitBytes, setKeyLimitBytes] = useState("");

  const statusQuery = useQuery<OutlineStatusOut>({
    queryKey: OUTLINE_STATUS_KEY,
    queryFn: ({ signal }) => api.get<OutlineStatusOut>("/outline/status", { signal }),
    retry: (_, err) => (err instanceof ApiError && err.statusCode === 503 ? false : true),
  });

  const keysQuery = useQuery<OutlineKeyListOut>({
    queryKey: OUTLINE_KEYS_KEY,
    queryFn: ({ signal }) => api.get<OutlineKeyListOut>("/outline/keys", { signal }),
    enabled: statusQuery.data?.status === "connected" || statusQuery.isSuccess,
    retry: (_, err) => (err instanceof ApiError && err.statusCode === 503 ? false : true),
  });

  const serverQuery = useQuery<OutlineServerOut>({
    queryKey: OUTLINE_SERVER_KEY,
    queryFn: ({ signal }) => api.get<OutlineServerOut>("/outline/server", { signal }),
    enabled: statusQuery.data?.status === "connected",
    retry: (_, err) => (err instanceof ApiError && err.statusCode === 503 ? false : true),
  });

  const metricsQuery = useQuery<OutlineMetricsOut>({
    queryKey: OUTLINE_METRICS_KEY,
    queryFn: ({ signal }) => api.get<OutlineMetricsOut>("/outline/metrics", { signal }),
    enabled: statusQuery.data?.status === "connected",
    retry: (_, err) =>
      err instanceof ApiError && (err.statusCode === 503 || err.statusCode === 502) ? false : true,
    refetchInterval: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: { name?: string; limitBytes?: number }) =>
      api.post<OutlineKeyOut>("/outline/keys", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      setCreateOpen(false);
      setCreateName("");
      setCreateLimitBytes("");
      addToast("Key created", "success");
    },
    onError: (e) => {
      addToast(getErrorMessage(e, "Failed to create key"), "error");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ keyId, name }: { keyId: string; name: string }) =>
      api.patch(`/outline/keys/${keyId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      setRenameKey(null);
      setRenameName("");
      addToast("Key renamed", "success");
    },
    onError: (e) => {
      addToast(getErrorMessage(e, "Failed to rename"), "error");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => api.request(`/outline/keys/${keyId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      setRevokeKey(null);
      addToast("Key revoked", "success");
    },
    onError: (e) => {
      addToast(getErrorMessage(e, "Failed to revoke"), "error");
    },
  });

  const serverLimitMutation = useMutation({
    mutationFn: (bytes: number) => api.put(`/outline/server/access-key-data-limit`, { bytes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_SERVER_KEY });
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      queryClient.invalidateQueries({ queryKey: OUTLINE_METRICS_KEY });
      setServerLimitModal(false);
      setServerLimitBytes("");
      addToast("Server data limit set", "success");
    },
    onError: (e) => addToast(getErrorMessage(e, "Failed to set limit"), "error"),
  });

  const serverLimitClearMutation = useMutation({
    mutationFn: () => api.request("/outline/server/access-key-data-limit", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_SERVER_KEY });
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      queryClient.invalidateQueries({ queryKey: OUTLINE_METRICS_KEY });
      addToast("Server data limit cleared", "success");
    },
    onError: (e) => addToast(getErrorMessage(e, "Failed to clear limit"), "error"),
  });

  const serverPortMutation = useMutation({
    mutationFn: (port: number) => api.put("/outline/server/port-for-new-access-keys", { port }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_SERVER_KEY });
      setServerPortModal(false);
      setServerPort("");
      addToast("Port for new keys updated", "success");
    },
    onError: (e) => addToast(getErrorMessage(e, "Failed to set port"), "error"),
  });

  const keyLimitMutation = useMutation({
    mutationFn: ({ keyId, bytes }: { keyId: string; bytes: number }) =>
      api.put(`/outline/keys/${keyId}/data-limit`, { bytes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      queryClient.invalidateQueries({ queryKey: OUTLINE_METRICS_KEY });
      setKeyLimitModal(null);
      setKeyLimitBytes("");
      addToast("Key data limit set", "success");
    },
    onError: (e) => addToast(getErrorMessage(e, "Failed to set key limit"), "error"),
  });

  const keyLimitClearMutation = useMutation({
    mutationFn: (keyId: string) =>
      api.request(`/outline/keys/${keyId}/data-limit`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTLINE_KEYS_KEY });
      queryClient.invalidateQueries({ queryKey: OUTLINE_METRICS_KEY });
      addToast("Key data limit cleared", "success");
    },
    onError: (e) => addToast(getErrorMessage(e, "Failed to clear key limit"), "error"),
  });

  const handleCopyLink = useCallback(async (keyId: string) => {
    try {
      const data = await api.get<OutlineDownloadTokenOut>(`/outline/keys/${keyId}/download-token`);
      const url = `${getBaseUrl().replace(/\/$/, "")}/outline/keys/config?token=${data.token}`;
      await navigator.clipboard.writeText(url);
      addToast("Download link copied", "success");
    } catch (e) {
      addToast(getErrorMessage(e, "Failed to copy link"), "error");
    }
  }, [addToast]);

  const handleDownload = useCallback((keyId: string) => {
    api
      .get<OutlineDownloadTokenOut>(`/outline/keys/${keyId}/download-token`)
      .then((data) => {
        const url = `${getBaseUrl().replace(/\/$/, "")}/outline/keys/config?token=${data.token}`;
        window.open(url, "_blank", "noopener");
      })
      .catch((e) => addToast(getErrorMessage(e, "Failed to get download link"), "error"));
  }, [addToast]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        truncate: true,
        titleTooltip: (r: OutlineKeyOut) => r.name ?? r.id,
        render: (r: OutlineKeyOut) => r.name ?? r.id,
      },
      { key: "id", header: "ID", mono: true, truncate: true, titleTooltip: (r: OutlineKeyOut) => r.id, render: (r: OutlineKeyOut) => r.id },
      { key: "port", header: "Port", render: (r: OutlineKeyOut) => r.port },
      { key: "method", header: "Method", render: (r: OutlineKeyOut) => r.method },
      {
        key: "bytes",
        header: "Usage",
        numeric: true,
        render: (r: OutlineKeyOut) => formatBytes(r.bytesTransferred ?? null),
      },
      {
        key: "dataLimit",
        header: "Limit",
        numeric: true,
        render: (r: OutlineKeyOut) =>
          r.dataLimit?.bytes != null ? formatBytes(r.dataLimit.bytes) : "—",
      },
      {
        key: "linked",
        header: "Linked device",
        truncate: true,
        mono: true,
        titleTooltip: (r: OutlineKeyOut) => r.linkedDeviceId ?? undefined,
        render: (r: OutlineKeyOut) => r.linkedDeviceId ?? "—",
      },
      {
        key: "actions",
        header: "Actions",
        actions: true,
        render: (r: OutlineKeyOut) => (
          <span className="ref-inline-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setKeyLimitModal(r); setKeyLimitBytes(""); }}
              aria-label="Set data limit"
            >
              Set limit
            </Button>
            {r.dataLimit?.bytes != null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => keyLimitClearMutation.mutate(r.id)}
                disabled={keyLimitClearMutation.isPending}
                aria-label="Clear data limit"
              >
                Clear limit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink(r.id)}
              aria-label="Copy download link"
            >
              Copy link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(r.id)}
              aria-label="Download config"
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setQrKeyId(r.id);
                setQrBlobUrl(null);
                try {
                  const blob = await api.getBlob(`/outline/keys/${r.id}/qr`);
                  setQrBlobUrl(URL.createObjectURL(blob));
                } catch (e) {
                  addToast(getErrorMessage(e, "Failed to load QR"), "error");
                  setQrKeyId(null);
                }
              }}
              aria-label="Show QR code"
            >
              QR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRenameKey(r);
                setRenameName(r.name ?? "");
              }}
              aria-label="Rename key"
            >
              Rename
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevokeKey(r)}
              className="text-danger"
              aria-label="Revoke key"
            >
              Revoke
            </Button>
          </span>
        ),
      },
    ],
    [addToast, handleCopyLink, handleDownload, keyLimitClearMutation]
  );

  const isDisabled = statusQuery.data?.status === "offline" || (statusQuery.error instanceof ApiError && statusQuery.error.statusCode === 503);

  if (statusQuery.error && statusQuery.error instanceof ApiError && statusQuery.error.statusCode === 503) {
    return (
      <div className="ref-page" data-testid="outline-integrations-page">
        <PageHeader
          icon={Shield}
          title="Outline"
          description="Integrations"
          breadcrumbItems={[
            { to: "/settings", label: "Settings" },
            { to: "/integrations/outline", label: "Outline" },
          ]}
        />
        <Panel as="section" variant="outline">
          <p className="ref-settings-text">Outline integration is disabled. Set OUTLINE_MANAGER_URL and OUTLINE_INTEGRATION_ENABLED to enable.</p>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/settings">Back to Settings</Link>
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="ref-page" data-testid="outline-integrations-page">
      <PageHeader
        icon={Shield}
        title="Outline"
        description="Manage Outline access keys (Shadowsocks). Keys and configs are handled server-side."
        breadcrumbItems={[
          { to: "/settings", label: "Settings" },
          { to: "/integrations/outline", label: "Outline" },
        ]}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => statusQuery.refetch()}
          disabled={statusQuery.isFetching}
          aria-label="Test connection"
        >
          Test connection
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          disabled={isDisabled}
        >
          Create key
        </Button>
      </PageHeader>

      <Panel as="section" variant="outline">
        <h3 className="ref-settings-title">Connection</h3>
        <p className="ref-settings-text">Base URL: Configured (hidden)</p>
        <p className="ref-settings-text">
          Status:{" "}
          {statusQuery.isLoading ? (
            "Checking…"
          ) : (
            <PrimitiveBadge
              variant={
                statusQuery.data?.status === "connected"
                  ? "success"
                  : statusQuery.data?.status === "degraded"
                    ? "warning"
                    : statusQuery.data?.status === "offline"
                      ? "danger"
                      : "neutral"
              }
            >
              {statusQuery.data?.status ?? "Unknown"}
            </PrimitiveBadge>
          )}
          {statusQuery.data?.version != null && ` · Version ${statusQuery.data.version}`}
        </p>
        {statusQuery.data?.lastCheckedAt && (
          <p className="ref-settings-text ref-muted">
            Last checked: {formatDateTime(statusQuery.data.lastCheckedAt)}
          </p>
        )}
      </Panel>

      {statusQuery.data?.status === "connected" && (
        <Panel as="section" variant="outline">
          <h3 className="ref-settings-title">Server</h3>
          {serverQuery.isLoading ? (
            <Skeleton height={80} />
          ) : serverQuery.error ? (
            <p className="ref-settings-text ref-muted">Failed to load server info.</p>
          ) : serverQuery.data ? (
            <>
              <p className="ref-settings-text">
                Port for new keys: {serverQuery.data.portForNewAccessKeys ?? "—"}
                {" · "}
                Hostname: {serverQuery.data.hostnameForAccessKeys ?? "—"}
              </p>
              <p className="ref-settings-text">
                Global access key limit:{" "}
                {serverQuery.data.accessKeyDataLimit?.bytes != null
                  ? formatBytes(serverQuery.data.accessKeyDataLimit.bytes)
                  : "None"}
              </p>
              <span className="ref-inline-actions">
                <Button variant="secondary" size="sm" onClick={() => setServerLimitModal(true)}>
                  Set global limit
                </Button>
                {serverQuery.data.accessKeyDataLimit?.bytes != null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => serverLimitClearMutation.mutate()}
                    disabled={serverLimitClearMutation.isPending}
                  >
                    Clear global limit
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setServerPortModal(true)}>
                  Set port for new keys
                </Button>
              </span>
            </>
          ) : null}
        </Panel>
      )}

      {statusQuery.data?.status === "connected" && (
        <Panel as="section" variant="outline">
          <h3 className="ref-settings-title">Telemetry</h3>
          {metricsQuery.isLoading ? (
            <Skeleton height={120} />
          ) : metricsQuery.error ? (
            <p className="ref-settings-text ref-muted">Metrics unavailable (experimental).</p>
          ) : metricsQuery.data ? (
            <>
              {metricsQuery.data.server && (
                <div className="ref-metrics-block">
                  <p className="ref-settings-text">
                    Server: tunnel time {metricsQuery.data.server.tunnelTime?.seconds ?? 0}s
                    {" · "}
                    data transferred {formatBytes(metricsQuery.data.server.dataTransferred?.bytes)}
                    {metricsQuery.data.server.bandwidth?.current?.data?.bytes != null && (
                      <> · current {formatBytes(metricsQuery.data.server.bandwidth.current.data.bytes)}</>
                    )}
                    {metricsQuery.data.server.bandwidth?.peak?.data?.bytes != null && (
                      <> · peak {formatBytes(metricsQuery.data.server.bandwidth.peak.data.bytes)}</>
                    )}
                  </p>
                </div>
              )}
              {metricsQuery.data.accessKeys && metricsQuery.data.accessKeys.length > 0 && (
                <div className="ref-metrics-block">
                  <p className="ref-settings-text ref-muted">Per key:</p>
                  <ul className="ref-list-compact">
                    {metricsQuery.data.accessKeys.map((ak) => (
                      <li key={String(ak.accessKeyId)}>
                        Key {String(ak.accessKeyId)}: {formatBytes(ak.dataTransferred?.bytes)} transferred
                        {ak.tunnelTime?.seconds != null && ` · ${ak.tunnelTime.seconds}s tunnel`}
                        {ak.connection?.lastTrafficSeen != null && (
                          <> · last seen {formatDateTime(new Date(ak.connection.lastTrafficSeen * 1000))}</>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!metricsQuery.data.server && !(metricsQuery.data.accessKeys?.length) && (
                <p className="ref-settings-text ref-muted">No metrics data.</p>
              )}
            </>
          ) : null}
        </Panel>
      )}

      <TableSection title="Access keys">
        {keysQuery.isLoading ? (
          <Skeleton height={200} />
        ) : keysQuery.error ? (
          <PageError
            message={keysQuery.error instanceof Error ? keysQuery.error.message : "Failed to load keys"}
            onRetry={() => keysQuery.refetch()}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={keysQuery.data?.keys ?? []}
              keyExtractor={(r) => r.id}
              emptyMessage="No keys yet. Create one above."
            />
          </>
        )}
      </TableSection>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Outline key">
        <div className="ref-modal-form">
          <label className="ref-label">Name (optional)</label>
          <Input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Key label"
            aria-label="Key name"
          />
          <label className="ref-label">Data limit in bytes (optional)</label>
          <Input
            type="number"
            value={createLimitBytes}
            onChange={(e) => setCreateLimitBytes(e.target.value)}
            placeholder="e.g. 1073741824 for 1 GB"
            aria-label="Data limit bytes"
          />
          <div className="ref-modal-actions">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const limit = createLimitBytes.trim() ? parseInt(createLimitBytes, 10) : undefined;
                if (createLimitBytes.trim() && (isNaN(limit!) || limit! < 0)) {
                  addToast("Invalid limit", "error");
                  return;
                }
                createMutation.mutate({ name: createName.trim() || undefined, limitBytes: limit });
              }}
              disabled={createMutation.isPending}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!renameKey}
        onClose={() => { setRenameKey(null); setRenameName(""); }}
        title="Rename key"
      >
        {renameKey && (
          <div className="ref-modal-form">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="New name"
              aria-label="New name"
            />
            <div className="ref-modal-actions">
              <Button variant="ghost" onClick={() => { setRenameKey(null); setRenameName(""); }}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => renameMutation.mutate({ keyId: renameKey.id, name: renameName })}
                disabled={renameMutation.isPending || !renameName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDanger
        open={!!revokeKey}
        onClose={() => setRevokeKey(null)}
        onConfirm={() => {
          if (revokeKey) revokeMutation.mutate(revokeKey.id);
        }}
        title="Revoke key"
        message={revokeKey ? `Revoke key "${revokeKey.name ?? revokeKey.id}"? This cannot be undone.` : ""}
        confirmLabel="Revoke"
        loading={revokeMutation.isPending}
      />

      {qrKeyId && (
        <Modal
          open={!!qrKeyId}
          onClose={() => {
            if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
            setQrKeyId(null);
            setQrBlobUrl(null);
          }}
          title="QR code"
        >
          <div className="ref-qr-modal">
            {qrBlobUrl ? (
              <img src={qrBlobUrl} alt="QR code for key" className="ref-qr-image" />
            ) : (
              <Skeleton height={256} width={256} />
            )}
            <p className="ref-muted">Scan with Outline client to add this key.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
                setQrKeyId(null);
                setQrBlobUrl(null);
              }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      <Modal open={serverLimitModal} onClose={() => { setServerLimitModal(false); setServerLimitBytes(""); }} title="Set global data limit">
        <div className="ref-modal-form">
          <label className="ref-label">Bytes (e.g. 1073741824 = 1 GB)</label>
          <Input
            type="number"
            value={serverLimitBytes}
            onChange={(e) => setServerLimitBytes(e.target.value)}
            placeholder="1073741824"
            aria-label="Limit bytes"
          />
          <div className="ref-modal-actions">
            <Button variant="ghost" onClick={() => { setServerLimitModal(false); setServerLimitBytes(""); }}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const n = parseInt(serverLimitBytes, 10);
                if (isNaN(n) || n < 0) { addToast("Invalid bytes", "error"); return; }
                serverLimitMutation.mutate(n);
              }}
              disabled={serverLimitMutation.isPending || !serverLimitBytes.trim()}
            >
              Set limit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={serverPortModal} onClose={() => { setServerPortModal(false); setServerPort(""); }} title="Set port for new keys">
        <div className="ref-modal-form">
          <label className="ref-label">Port (1–65535)</label>
          <Input
            type="number"
            min={1}
            max={65535}
            value={serverPort}
            onChange={(e) => setServerPort(e.target.value)}
            placeholder="e.g. 8388"
            aria-label="Port"
          />
          <div className="ref-modal-actions">
            <Button variant="ghost" onClick={() => { setServerPortModal(false); setServerPort(""); }}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const n = parseInt(serverPort, 10);
                if (isNaN(n) || n < 1 || n > 65535) { addToast("Invalid port", "error"); return; }
                serverPortMutation.mutate(n);
              }}
              disabled={serverPortMutation.isPending || !serverPort.trim()}
            >
              Set port
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!keyLimitModal}
        onClose={() => { setKeyLimitModal(null); setKeyLimitBytes(""); }}
        title="Set key data limit"
      >
        {keyLimitModal && (
          <div className="ref-modal-form">
            <p className="ref-muted">Key: {keyLimitModal.name ?? keyLimitModal.id}</p>
            <label className="ref-label">Bytes (e.g. 1073741824 = 1 GB)</label>
            <Input
              type="number"
              value={keyLimitBytes}
              onChange={(e) => setKeyLimitBytes(e.target.value)}
              placeholder="1073741824"
              aria-label="Limit bytes"
            />
            <div className="ref-modal-actions">
              <Button variant="ghost" onClick={() => { setKeyLimitModal(null); setKeyLimitBytes(""); }}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const n = parseInt(keyLimitBytes, 10);
                  if (isNaN(n) || n < 0) { addToast("Invalid bytes", "error"); return; }
                  keyLimitMutation.mutate({ keyId: keyLimitModal.id, bytes: n });
                }}
                disabled={keyLimitMutation.isPending || !keyLimitBytes.trim()}
              >
                Set limit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
