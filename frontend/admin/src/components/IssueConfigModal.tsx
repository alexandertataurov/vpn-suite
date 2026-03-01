import { useState, useCallback, useEffect } from "react";
import { Modal, Button, Input, useToast, CopyButton, CodeBlock, QrPanel, Text, HelperText } from "@/design-system";
import type {
  AdminIssuePeerRequest,
  AdminIssuePeerResponse,
  ServerOut,
} from "@vpn-suite/shared/types";
import { ApiError, getErrorMessage } from "@vpn-suite/shared";
import { api } from "../api/client";

/** QR level by payload size so full config fits (Level H has ~1.3KB capacity). */
function issueConfigQrLevel(payload: string): "L" | "M" | "H" {
  const bytes = new TextEncoder().encode(payload).length;
  return bytes > 1200 ? "L" : bytes > 900 ? "M" : "H";
}

export interface IssueConfigModalProps {
  open: boolean;
  onClose: () => void;
  server: ServerOut | null;
  onSuccess?: () => void;
}

export function IssueConfigModal({
  open,
  onClose,
  server,
  onSuccess,
}: IssueConfigModalProps) {
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");
  const [clientEndpoint, setClientEndpoint] = useState("");
  const [result, setResult] = useState<AdminIssuePeerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const { addToast } = useToast();

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setRequestId(null);
    setLabel("");
    setExpiresInDays("");
    setClientEndpoint("");
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleSubmit = async () => {
    if (!server) return;
    setLoading(true);
    setError(null);
    try {
      const body: AdminIssuePeerRequest = {
        label: label.trim() || undefined,
        expires_in_days:
          expiresInDays === "" ? undefined : Number(expiresInDays),
        client_endpoint: clientEndpoint.trim() || undefined,
      };
      const data = await api.post<AdminIssuePeerResponse>(
        `/servers/${server.id}/peers`,
        body
      );
      setResult(data);
      setRequestId(data.request_id || null);
      onSuccess?.();
      addToast("Config issued", "success");
    } catch (e) {
      let msg = getErrorMessage(e, "Issue failed");
      if (msg.toLowerCase().includes("system operator not seeded")) {
        msg = "System operator not seeded. Run: ./manage.sh seed-operator";
      }
      setError(msg);
      setRequestId(e instanceof ApiError ? e.requestId ?? null : null);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const footer = result ? (
    <Button variant="primary" onClick={handleClose}>
      Done
    </Button>
  ) : (
    <>
      <Button variant="ghost" onClick={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={loading}
        disabled={!server}
      >
        Issue config
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Issue config" footer={footer}>
      {!result ? (
        <div className="issue-config-form">
          {server && (
            <Text variant="muted" as="p">
              Server: {server.name || server.id}
            </Text>
          )}
          <Input
            label="Label (device name)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional"
            aria-label="Device label"
          />
          <Input
            label="Expiration (days)"
            type="number"
            min={1}
            value={expiresInDays === "" ? "" : String(expiresInDays)}
            onChange={(e) =>
              setExpiresInDays(
                e.target.value === "" ? "" : parseInt(e.target.value, 10)
              )
            }
            placeholder="Optional"
            aria-label="Expiration days"
          />
          <Input
            label="Endpoint (host:port)"
            value={clientEndpoint}
            onChange={(e) => setClientEndpoint(e.target.value)}
            placeholder={
              server?.vpn_endpoint
                ? `${server.vpn_endpoint} (or override)`
                : "Optional: override if auto-detect fails (e.g. vpn.example.com:45790)"
            }
            aria-label="VPN endpoint override"
          />
          {error && (
            <div role="alert">
              <HelperText variant="error">{error}</HelperText>
              {requestId && (
                <Text variant="muted" as="span" className="block mt-sm">
                  Request ID: {requestId}
                </Text>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="issue-config-result">
          <Text as="p" className="text-success">
            Peer created. Three configs issued — AmneziaWG, WG (obfuscated), and WG (standard).
          </Text>
          <HelperText variant="hint" className="mb-3">
            QR contains the full .conf (Interface + Peer). If scan fails, use Download .conf or copy the config below.
          </HelperText>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Text as="p" variant="muted" className="mb-2">AmneziaWG (obfuscated)</Text>
              {result.config_awg?.qr_payload && (
                <>
                  <QrPanel
                    value={result.config_awg.qr_payload}
                    size={220}
                    level={issueConfigQrLevel(result.config_awg.qr_payload)}
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
                    level={issueConfigQrLevel(result.config_wg_obf.qr_payload)}
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
                    level={issueConfigQrLevel(result.config_wg.qr_payload)}
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
          {result.request_id && (
            <Text variant="muted" as="p">
              Request ID: {result.request_id}
            </Text>
          )}
        </div>
      )}
    </Modal>
  );
}
