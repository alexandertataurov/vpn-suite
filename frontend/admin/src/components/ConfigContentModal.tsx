import { useEffect, useState } from "react";
import { Modal, Button, CopyButton, CodeBlock, useToast } from "@vpn-suite/shared/ui";
import { getErrorMessage } from "@vpn-suite/shared";
import { api } from "../api/client";

export interface ConfigContentModalProps {
  open: boolean;
  onClose: () => void;
  issuedConfigId: string | null;
  label?: string;
}

export function ConfigContentModal({
  open,
  onClose,
  issuedConfigId,
  label,
}: ConfigContentModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!open || !issuedConfigId) {
      setContent(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<{ content: string }>(`/admin/configs/issued/${issuedConfigId}/content`)
      .then((data) => {
        setContent(data.content);
      })
      .catch((e) => {
        const msg = getErrorMessage(e, "Failed to load config");
        setError(msg);
        addToast(msg, "error");
      })
      .finally(() => setLoading(false));
  }, [open, issuedConfigId, addToast]);

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client.conf";
    a.click();
    URL.revokeObjectURL(url);
    addToast("Download started", "success");
  };

  const footer = content ? (
    <>
      <Button variant="ghost" onClick={onClose}>
        Close
      </Button>
      <Button variant="primary" onClick={handleDownload}>
        Download
      </Button>
    </>
  ) : (
    <Button variant="ghost" onClick={onClose}>
      Close
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label ? `Config: ${label}` : "Config"}
      footer={footer}
      className="ref-config-content-modal"
    >
      {loading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-danger">{error}</p>}
      {content && (
        <CodeBlock
          value={content}
          maxHeight={400}
          wrap
          actions={<CopyButton value={content} label="Copy config" copiedMessage="Copied to clipboard" />}
        />
      )}
    </Modal>
  );
}
