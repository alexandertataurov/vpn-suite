import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button, VisuallyHidden } from "@/design-system";

export type RefreshStatus = "idle" | "loading" | "success" | "error";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  idleLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  icon?: ReactNode;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  "data-testid"?: string;
}

const RESET_AFTER_MS = 2500;

export function RefreshButton({
  onRefresh,
  idleLabel = "Refresh",
  loadingLabel = "Updating…",
  successLabel = "Updated just now",
  errorLabel = "Update failed",
  icon,
  ariaLabel,
  className,
  size = "sm",
  variant = "secondary",
  disabled = false,
  "data-testid": dataTestId,
}: RefreshButtonProps) {
  const [status, setStatus] = useState<RefreshStatus>("idle");
  const resetTimer = useRef<number | null>(null);

  const label =
    status === "loading"
      ? loadingLabel
      : status === "success"
        ? successLabel
        : status === "error"
          ? errorLabel
          : idleLabel;

  useEffect(() => {
    if (status !== "success" && status !== "error") return undefined;
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setStatus("idle");
    }, RESET_AFTER_MS);
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = null;
    };
  }, [status]);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const handleClick = useCallback(async () => {
    if (status === "loading") return;
    setStatus("loading");
    try {
      await onRefresh();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [onRefresh, status]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || status === "loading"}
      aria-label={ariaLabel}
      aria-busy={status === "loading"}
      className={className}
      data-testid={dataTestId}
    >
      {icon ? (
        <span className={status === "loading" ? "animate-spin" : ""} aria-hidden>
          {icon}
        </span>
      ) : null}
      {label}
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {status === "idle" ? "" : label}
        </span>
      </VisuallyHidden>
    </Button>
  );
}
