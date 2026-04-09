import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type HelperTextVariant = "hint" | "error" | "success" | "count";

export interface HelperTextProps {
  variant?: HelperTextVariant;
  className?: string;
  children?: ReactNode;
  id?: string;
  role?: "alert";
  showIcon?: boolean;
  current?: number;
  max?: number;
  "aria-live"?: "polite" | "assertive" | "off";
}

const variantClass: Record<HelperTextVariant, string> = {
  hint: "typo-helper-hint",
  error: "typo-helper-error",
  success: "typo-helper-success",
  count: "typo-helper-count",
};

const variantIcon: Partial<Record<HelperTextVariant, string>> = {
  error: "⚠",
  success: "✓",
};

export function HelperText({
  variant = "hint",
  className = "",
  children,
  role,
  showIcon,
  current,
  max,
  "aria-live": ariaLive,
  ...props
}: HelperTextProps) {
  const resolvedRole = role ?? (variant === "error" ? "alert" : undefined);
  const resolvedAriaLive =
    ariaLive ?? (variant === "error" ? "assertive" : variant === "count" || variant === "hint" || variant === "success" ? "polite" : undefined);
  const resolvedShowIcon = showIcon ?? (variant === "error");
  const icon = resolvedShowIcon ? variantIcon[variant] : undefined;
  const countText =
    variant === "count" && typeof current === "number" && typeof max === "number"
      ? `${current} / ${max}`
      : children;
  const isNearLimit =
    variant === "count" && typeof current === "number" && typeof max === "number" && current / max >= 0.75 && current < max;
  const isAtLimit =
    variant === "count" && typeof current === "number" && typeof max === "number" && current >= max;

  return (
    <span
      className={cn(
        "typo-helper",
        variantClass[variant],
        icon && "typo-helper-with-icon",
        className,
      )}
      role={resolvedRole}
      aria-live={resolvedAriaLive}
      data-near-limit={isNearLimit ? "true" : undefined}
      data-at-limit={isAtLimit ? "true" : undefined}
      {...props}
    >
      {icon ? <span className="typo-helper-icon" aria-hidden>{icon}</span> : null}
      <span className="typo-helper-copy">{countText}</span>
    </span>
  );
}
