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
  /** Body text. */
  message?: string | ReactNode;
  submessage?: ReactNode;
  /** Semantic action button. For custom content (e.g. Link), use action with onClick that navigates. */
  action?: { label: string; onClick: () => void };
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
  submessage,
  action,
  onDismiss,
  iconMode = "dot",
  fullWidth = true,
  compact = false,
  className,
  "data-testid": dataTestId,
}: InlineAlertProps) {
  const hasLabel = Boolean(labelProp);
  const resolvedMessage = messageProp;
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
            <span className="alert-label inline-alert-title">{labelProp}</span>
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
