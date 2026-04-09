import type { DeviceOut } from "@/shared/types/admin-api";
import { deviceStatus, formatRelative, getDeviceConfigHealth } from "@/features/devices/utils/deviceFormatting";
import type { DeviceHealthInfo } from "@/features/devices/utils/deviceFormatting";
import {
  AnchorButton,
  Badge,
  Button,
  DataTable,
  Modal,
  SectionHeader,
  Skeleton,
} from "@/design-system/primitives";

interface ConfigEntry {
  download_url: string;
  qr_payload: string;
  amnezia_vpn_key?: string | null;
}

export interface ReissueResult {
  config_awg: ConfigEntry;
  config_wg_obf: ConfigEntry;
  config_wg: ConfigEntry;
  request_id: string;
}

export interface DeviceDetailModalProps {
  open: boolean;
  onClose: () => void;
  deviceId: string | null;
  device: DeviceOut | null | undefined;
  isLoading: boolean;
  actionError: string | null;
  actionPending: boolean;
  reissueResult: ReissueResult | null;
  onReissue: (id: string) => void;
  onReconcile: (id: string) => void;
  onSuspend: (id: string) => void;
  onResume: (id: string) => void;
  onRevokeClick: (id: string) => void;
  onCopyToClipboard: (value: string, title: string) => Promise<void>;
  onSetQr: (payload: string, title: string) => void;
  onDownloadIssuedConfig: (id: string) => void;
  onCopyIssuedConfig: (id: string) => Promise<void>;
  onShowIssuedConfigQr: (id: string) => Promise<void>;
  onAwgDownloadLinkQr: (deviceId: string) => Promise<void>;
  showToast: (opts: { variant: "danger"; title: string }) => void;
}

export function DeviceDetailModal({
  open,
  onClose,
  deviceId,
  device,
  isLoading,
  actionError,
  actionPending,
  reissueResult,
  onReissue,
  onReconcile,
  onSuspend,
  onResume,
  onRevokeClick,
  onCopyToClipboard,
  onSetQr,
  onDownloadIssuedConfig,
  onCopyIssuedConfig,
  onShowIssuedConfigQr,
  onAwgDownloadLinkQr,
}: DeviceDetailModalProps) {
  const detailHealth: DeviceHealthInfo | null = device ? getDeviceConfigHealth(device.telemetry) : null;

  return (
    <Modal open={open} onClose={onClose} title="Device details">
      {deviceId && (
        <div className="devices-page__detail">
          {isLoading && <Skeleton height={80} />}
          {!isLoading && device && (
            <>
              <dl className="devices-page__detail-dl">
                <dt>Device</dt>
                <dd>{device.device_name || device.id}</dd>
                <dt>ID</dt>
                <dd className="devices-page__detail-id">{device.id}</dd>
                <dt>User</dt>
                <dd>{device.user_email ?? `#${device.user_id}`}</dd>
                <dt>Server</dt>
                <dd>{device.server_id}</dd>
                <dt>Status</dt>
                <dd>{deviceStatus(device)}</dd>
                {detailHealth && (
                  <>
                    <dt>Health</dt>
                    <dd>
                      <Badge variant={detailHealth.variant} size="sm">
                        {detailHealth.label}
                      </Badge>
                      {detailHealth.detail && (
                        <span className="devices-page__detail-health-meta">{detailHealth.detail}</span>
                      )}
                    </dd>
                  </>
                )}
                {device.apply_status && (
                  <>
                    <dt>Apply status</dt>
                    <dd>{device.apply_status}</dd>
                  </>
                )}
                {device.last_error && (
                  <>
                    <dt>Last error</dt>
                    <dd className="devices-page__detail-error">{device.last_error}</dd>
                  </>
                )}
              </dl>
              <div className="devices-page__detail-buttons" aria-label="Device config actions">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => onReissue(device.id)}
                  disabled={actionPending}
                >
                  Rotate config
                </Button>
                {reissueResult && (
                  <div className="devices-page__reissue-groups">
                    <div className="devices-page__reissue-group">
                      <span className="devices-page__reissue-group-label">Downloads</span>
                      <div className="devices-page__detail-buttons">
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
                      </div>
                    </div>
                    <div className="devices-page__reissue-group">
                      <span className="devices-page__reissue-group-label">Copy</span>
                      <div className="devices-page__detail-buttons">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            void onCopyToClipboard(reissueResult.config_awg.qr_payload, "AWG config copied")
                          }
                          disabled={actionPending}
                        >
                          Copy AWG
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            void onCopyToClipboard(
                              reissueResult.config_wg_obf.qr_payload,
                              "WG (obf) config copied"
                            )
                          }
                          disabled={actionPending}
                        >
                          Copy WG (obf)
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            void onCopyToClipboard(reissueResult.config_wg.qr_payload, "WG config copied")
                          }
                          disabled={actionPending}
                        >
                          Copy WG
                        </Button>
                      </div>
                    </div>
                    <div className="devices-page__reissue-group">
                      <span className="devices-page__reissue-group-label">Show QR</span>
                      <div className="devices-page__detail-buttons">
                        {reissueResult.config_awg.amnezia_vpn_key && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              onSetQr(
                                reissueResult.config_awg.amnezia_vpn_key!,
                                "AmneziaVPN QR (vpn:// key)"
                              );
                            }}
                            disabled={actionPending}
                          >
                            AmneziaVPN QR
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void onAwgDownloadLinkQr(device.id)}
                          disabled={actionPending}
                        >
                          AmneziaWG QR (download link)
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            onSetQr(reissueResult.config_awg.qr_payload, "AmneziaWG QR (legacy .conf)");
                          }}
                          disabled={actionPending}
                        >
                          AmneziaWG QR (legacy .conf)
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            onSetQr(reissueResult.config_wg_obf.qr_payload, "WG (obf) config QR");
                          }}
                          disabled={actionPending}
                        >
                          WG (obf) QR
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            onSetQr(reissueResult.config_wg.qr_payload, "WG config QR");
                          }}
                          disabled={actionPending}
                        >
                          WG QR
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {reissueResult && (
                <p className="devices-page__detail-empty">
                  Reissued (request_id: {reissueResult.request_id})
                </p>
              )}
              <SectionHeader label="Configurations" size="sm" />
              {device.issued_configs && device.issued_configs.length > 0 ? (
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
                    rows={device.issued_configs.map((c) => ({
                      ...c,
                      created_at: c.created_at ? formatRelative(c.created_at) : "—",
                      consumed_at: c.consumed_at ? formatRelative(c.consumed_at) : "—",
                      download: (
                        <div className="devices-page__config-actions">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownloadIssuedConfig(c.id)}
                            disabled={actionPending}
                          >
                            Download
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void onCopyIssuedConfig(c.id)}
                            disabled={actionPending}
                          >
                            Copy
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void onShowIssuedConfigQr(c.id)}
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
                  {deviceStatus(device) === "active" && (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => onReconcile(device.id)}
                        disabled={actionPending}
                      >
                        Reconcile
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => onSuspend(device.id)}
                        disabled={actionPending}
                      >
                        Suspend
                      </Button>
                    </>
                  )}
                  {deviceStatus(device) === "suspended" && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => onResume(device.id)}
                      disabled={actionPending}
                    >
                      Resume
                    </Button>
                  )}
                  {!device.revoked_at && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => onRevokeClick(device.id)}
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
  );
}
