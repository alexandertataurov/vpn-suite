import { useState, useCallback } from "react";
import { Button } from "./Button";
import { VisuallyHidden } from "../misc/VisuallyHidden";
import { useToast } from "../feedback/Toast";

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedMessage?: string;
  className?: string;
  "data-testid"?: string;
  onCopy?: () => void;
}

export function CopyButton({
  value,
  label = "Copy",
  copiedMessage = "Copied",
  className,
  "data-testid": dataTestId,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleClick = useCallback(() => {
    if (typeof navigator?.clipboard === "undefined") {
      addToast("Copy not supported", "error");
      return;
    }
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        addToast(copiedMessage, "success");
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
      },
      () => addToast("Copy failed", "error")
    );
  }, [value, copiedMessage, addToast, onCopy]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={label}
      className={className}
      data-testid={dataTestId}
    >
      <span aria-hidden>{copied ? "✓" : "📋"}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </Button>
  );
}
