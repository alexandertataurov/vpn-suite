import { useState, useCallback } from "react";
import { Button } from "./Button";
import { VisuallyHidden } from "./VisuallyHidden";
import { useToast } from "../feedback/Toast";

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedMessage?: string;
  variant?: "icon" | "text";
  className?: string;
  "data-testid"?: string;
  onCopy?: () => void;
}

export function CopyButton({
  value,
  label = "Copy",
  copiedMessage = "Copied",
  variant = "icon",
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

  const content =
    variant === "text" ? (
      <span aria-hidden>{copied ? copiedMessage : label}</span>
    ) : (
      <>
        <span aria-hidden>{copied ? "✓" : "📋"}</span>
        <VisuallyHidden>{label}</VisuallyHidden>
      </>
    );

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={variant === "icon" ? label : undefined}
      className={className}
      data-testid={dataTestId}
    >
      {content}
    </Button>
  );
}
