import { cn } from "../../utils/cn";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../buttons/Button";
import { CopyButton } from "../buttons/CopyButton";

export type QRErrorLevel = "L" | "M" | "Q" | "H";

export interface QrPanelProps {
  value: string;
  size?: number;
  /** Higher = more reliable scan but less data capacity. Use "M" or "L" for long configs so full payload fits. */
  level?: QRErrorLevel;
  downloadLabel?: string;
  copyLabel?: string;
  /** "text" = show "Copy" label instead of icon. */
  copyVariant?: "icon" | "text";
  onDownload?: () => void;
  onCopy?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function QrPanel({
  value,
  size = 180,
  level = "M",
  downloadLabel = "Download",
  copyLabel = "Copy",
  copyVariant = "icon",
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
      <QRCodeSVG value={value} size={size} level={level} />
      <div className="qr-panel-actions">
        {onDownload ? (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            {downloadLabel}
          </Button>
        ) : null}
        <CopyButton value={value} label={copyLabel} copiedMessage="Copied" variant={copyVariant} onCopy={onCopy} />
      </div>
    </div>
  );
}
