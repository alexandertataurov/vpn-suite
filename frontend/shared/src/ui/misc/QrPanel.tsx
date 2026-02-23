import { cn } from "../../utils/cn";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../buttons/Button";
import { CopyButton } from "../buttons/CopyButton";

export interface QrPanelProps {
  value: string;
  size?: number;
  downloadLabel?: string;
  copyLabel?: string;
  onDownload?: () => void;
  onCopy?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function QrPanel({
  value,
  size = 180,
  downloadLabel = "Download",
  copyLabel = "Copy",
  onDownload,
  onCopy,
  className,
  "data-testid": dataTestId,
}: QrPanelProps) {
  return (
    <div
      className={cn("qr-panel", className)}
      role="img"
      aria-label="QR code for config"
      data-testid={dataTestId}
    >
      <QRCodeSVG value={value} size={size} level="M" />
      <div className="qr-panel-actions">
        {onDownload ? (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            {downloadLabel}
          </Button>
        ) : null}
        <CopyButton value={value} label={copyLabel} copiedMessage="Copied" onCopy={onCopy} />
      </div>
    </div>
  );
}
