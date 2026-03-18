import "./InlineAlert.css";
import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import {
  IconInfo,
  IconAlertTriangle,
  IconCircleX,
  IconCheckCircle,
  IconX,
} from "@/design-system/icons";

export interface InlineAlertProps {
  variant: "info" | "warning" | "error" | "success";
  /** Bold label, e.g. "Action required". Optional. */
  label?: string;
  /** Body text. Required for new API; falls back to body for backward compat. */
  message?: string | ReactNode;
  /** @deprecated Use label + message. Kept for RestoreAccess. */
  title?: string;
  /** @deprecated Use message. Kept for RestoreAccess. */
  body?: ReactNode;
  submessage?: ReactNode;
  /** New API: semantic action button. */
  action?: { label: string; onClick: () => void };
  /** @deprecated Use action. Custom actions slot for backward compat. */
  actions?: ReactNode;
  onDismiss?: () => void;
  iconMode?: "dot" | "icon";
  fullWidth?: boolean;
  /** Compact layout for secondary pages (surface-2, bordered). */
  compact?: boolean;
  className?: string;
  "data-testid"?: string;
}

const variantRole = {
  info: "status" as const,
  warning: "alert" as const,
  error: "alert" as const,
  success: "status" as const,
};

const variantIcons = {
  info: IconInfo,
  warning: IconAlertTriangle,
  error: IconCircleX,
  success: IconCheckCircle,
} as const;

export function InlineAlert({
  variant,
  label: labelProp,
  message: messageProp,
  title,
  body,
  submessage,
  action,
  actions,
  onDismiss,
  iconMode = "dot",
  fullWidth = true,
  compact = false,
  className,
  "data-testid": dataTestId,
}: InlineAlertProps) {
  const label = labelProp ?? title;
  const hasLabel = Boolean(label);
  const resolvedMessage = messageProp ?? body;
  const IconComponent = variantIcons[variant];

  return (
    <div
      role={variantRole[variant]}
      aria-live="polite"
      className={cn(
        "alert",
        `alert--${variant}`,
        `inline-alert-${variant}`,
        !hasLabel && "alert--no-label",
        fullWidth && "alert--full-width",
        compact && "inline-alert--modern",
        className
      )}
      data-testid={dataTestId}
    >
      <span className="alert-accent" aria-hidden />
      <div className="alert-body">
        <div className="alert-header">
          {iconMode === "icon" ? (
            <span className="alert-icon-wrap" aria-hidden>
              <IconComponent size={16} strokeWidth={2} />
            </span>
          ) : (
            <span className="alert-dot alert-icon" aria-hidden />
          )}
          {hasLabel ? (
            <span className="alert-label inline-alert-title">{label}</span>
          ) : null}
        </div>
        {resolvedMessage != null ? (
          <p className="alert-message inline-alert-message">
            {typeof resolvedMessage === "string" ? resolvedMessage : resolvedMessage}
          </p>
        ) : null}
        {submessage ? (
          <div className="inline-alert-submessage">{submessage}</div>
        ) : null}
        {action ? (
          <button
            type="button"
            className="alert-action"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ) : null}
        {actions && !action ? (
          <div className="inline-alert-actions">{actions}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <IconX size={12} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
