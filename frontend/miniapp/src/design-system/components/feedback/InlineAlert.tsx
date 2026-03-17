import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface InlineAlertProps {
  variant: "info" | "warning" | "error" | "success";
  title: string;
  body?: ReactNode;
  message?: string;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

const variantRole = {
  info: "status" as const,
  warning: "alert" as const,
  error: "alert" as const,
  success: "status" as const,
};

const variantClass = {
  info: "inline-alert-info alert info",
  warning: "inline-alert-warning alert warning",
  error: "inline-alert-error alert danger",
  success: "inline-alert-success alert success",
} as const;

export function InlineAlert({
  variant,
  title,
  body,
  message,
  actions,
  className,
  "data-testid": dataTestId,
}: InlineAlertProps) {
  const resolvedBody = body ?? message;
  const hasBody = Boolean(resolvedBody);
  const hasActions = Boolean(actions);

  return (
    <div
      role={variantRole[variant]}
      aria-live="polite"
      className={cn("inline-alert", variantClass[variant], className)}
      data-variant={variant}
      data-has-body={hasBody ? "true" : "false"}
      data-has-actions={hasActions ? "true" : "false"}
      data-testid={dataTestId}
    >
      <span className="alert-icon" aria-hidden />
      <div className="inline-alert-content">
        <div className="alert-title inline-alert-title">{title}</div>
        {resolvedBody ? <div className="alert-desc inline-alert-message">{resolvedBody}</div> : null}
      </div>
      {actions ? <div className="inline-alert-actions">{actions}</div> : null}
    </div>
  );
}
