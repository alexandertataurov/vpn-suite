import { Modal, Button, CopyButton, CodeBlock, QrPanel, Text, HelperText } from "@vpn-suite/shared/ui";
import type { AdminRotatePeerResponse, DeviceOut } from "@vpn-suite/shared/types";

function reissueQrLevel(payload: string): "L" | "M" | "H" {
  const bytes = new TextEncoder().encode(payload).length;
  return bytes > 1200 ? "L" : bytes > 900 ? "M" : "H";
}

export interface ReissueConfigModalProps {
  open: boolean;
  onClose: () => void;
  device: DeviceOut | null;
  result: AdminRotatePeerResponse | null;
  loading: boolean;
  onConfirm: () => void;
}

export function ReissueConfigModal({
  open,
  onClose,
  device,
  result,
  loading,
  onConfirm,
}: ReissueConfigModalProps) {
  const footer = result ? (
    <Button variant="primary" onClick={onClose}>
      Done
    </Button>
  ) : (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onConfirm} loading={loading} disabled={!device}>
        Reissue config
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Reissue config" footer={footer}>
      {!result ? (
        <Text as="p">
          Reissue config for device {device?.device_name || device?.id?.slice(0, 8) || "?"}? New keys will be
          generated; the client must use the new config.
        </Text>
      ) : (
        <div className="issue-config-result">
          <Text as="p" className="text-success">
            Config reissued. Share the new config or QR with the client.
          </Text>
          <HelperText variant="hint" className="mb-3">
            QR contains the full .conf. If scan fails, use Download .conf or copy the config below.
          </HelperText>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Text as="p" variant="muted" className="mb-2">AmneziaWG (obfuscated)</Text>
              {result.config_awg?.qr_payload && (
                <>
                  <QrPanel
                    value={result.config_awg.qr_payload}
                    size={220}
                    level={reissueQrLevel(result.config_awg.qr_payload)}
                    downloadLabel="Download .conf"
                    copyLabel="Copy"
                    copyVariant="text"
                    onDownload={
                      result.config_awg.download_url
                        ? () => window.open(result.config_awg.download_url, "_blank")
                        : undefined
                    }
                  />
                  <CodeBlock
                    value={result.config_awg.qr_payload}
                    maxHeight={180}
                    wrap
                    actions={<CopyButton value={result.config_awg.qr_payload} label="Copy" copiedMessage="Copied" variant="text" />}
                  />
                </>
              )}
            </div>
            <div>
              <Text as="p" variant="muted" className="mb-2">WireGuard (obfuscated)</Text>
              {result.config_wg_obf?.qr_payload && (
                <>
                  <QrPanel
                    value={result.config_wg_obf.qr_payload}
                    size={220}
                    level={reissueQrLevel(result.config_wg_obf.qr_payload)}
                    downloadLabel="Download .conf"
                    copyLabel="Copy"
                    copyVariant="text"
                    onDownload={
                      result.config_wg_obf.download_url
                        ? () => window.open(result.config_wg_obf.download_url, "_blank")
                        : undefined
                    }
                  />
                  <CodeBlock
                    value={result.config_wg_obf.qr_payload}
                    maxHeight={180}
                    wrap
                    actions={<CopyButton value={result.config_wg_obf.qr_payload} label="Copy" copiedMessage="Copied" variant="text" />}
                  />
                </>
              )}
            </div>
            <div>
              <Text as="p" variant="muted" className="mb-2">WireGuard (standard)</Text>
              {result.config_wg?.qr_payload && (
                <>
                  <QrPanel
                    value={result.config_wg.qr_payload}
                    size={220}
                    level={reissueQrLevel(result.config_wg.qr_payload)}
                    downloadLabel="Download .conf"
                    copyLabel="Copy"
                    copyVariant="text"
                    onDownload={
                      result.config_wg.download_url
                        ? () => window.open(result.config_wg.download_url, "_blank")
                        : undefined
                    }
                  />
                  <CodeBlock
                    value={result.config_wg.qr_payload}
                    maxHeight={180}
                    wrap
                    actions={<CopyButton value={result.config_wg.qr_payload} label="Copy" copiedMessage="Copied" variant="text" />}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
