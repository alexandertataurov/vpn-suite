import { useCallback } from "react";
import { useToast } from "../feedback/Toast";
import { cn } from "@vpn-suite/shared";

function truncateId(value: string): string {
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}\u2026${value.slice(-4)}`;
}

export interface CopyableIdProps {
  value: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

export function CopyableId({
  value,
  className = "",
  title,
  "aria-label": ariaLabel,
}: CopyableIdProps) {
  const { addToast } = useToast();
  const handleClick = useCallback(() => {
    if (!value || typeof navigator?.clipboard === "undefined") return;
    navigator.clipboard.writeText(value);
    addToast("Copied to clipboard", "success");
  }, [value, addToast]);

  const display = truncateId(value);
  const fullTitle = title ?? value;

  return (
    <button
      type="button"
      className={cn("ds-copyable-id", className)}
      title={fullTitle}
      aria-label={ariaLabel ?? `Copy ${display}`}
      onClick={handleClick}
    >
      {display}
    </button>
  );
}

CopyableId.displayName = "CopyableId";
