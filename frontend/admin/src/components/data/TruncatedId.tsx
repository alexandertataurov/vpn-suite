import { useCallback } from "react";
import { useToast } from "@/design-system";
import { cn } from "@vpn-suite/shared";

function truncateId(value: string): string {
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export interface TruncatedIdProps {
  value: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

export function TruncatedId({
  value,
  className = "",
  title,
  "aria-label": ariaLabel,
}: TruncatedIdProps) {
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
      className={cn("truncated-id font-data", className)}
      title={fullTitle}
      aria-label={ariaLabel ?? `Copy ${display}`}
      onClick={handleClick}
    >
      {display}
    </button>
  );
}
