import { QRCodeSVG } from "qrcode.react";
import { Button, Modal } from "@/design-system/primitives";

function normalizeConfigForQr(config: string): string {
  let s = config.replace(/^\uFEFF/, "");
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/^\s+(\[Interface\])/m, "$1");
  return s;
}

interface ConfigQrModalProps {
  open: boolean;
  onClose: () => void;
  title: string | null;
  payload: string | null;
  onCopy: () => void;
  pending: boolean;
}

export function ConfigQrModal({
  open,
  onClose,
  title,
  payload,
  onCopy,
  pending,
}: ConfigQrModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Config QR"}>
      {payload && (
        <div className="devices-page__qr">
          <QRCodeSVG
            value={normalizeConfigForQr(payload)}
            size={300}
            level="L"
            includeMargin
          />
          <div className="devices-page__qr-actions">
            <Button type="button" variant="default" onClick={onCopy} disabled={pending}>
              Copy config
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
