import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface InlineAlertProps {
  variant: "info" | "warning" | "error";
  title: string;
  message?: string;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

const variantRole = { info: "status" as const, warning: "alert" as const, error: "alert" as const };

const variantClass = {
  info: "inline-alert-info",
  warning: "inline-alert-warning",
  error: "inline-alert-error",
} as const;

export function InlineAlert({
  variant,
  title,
  message,
  actions,
  className,
  "data-testid": dataTestId,
}: InlineAlertProps) {
  return (
    <div
      role={variantRole[variant]}
      aria-live="polite"
      className={cn("inline-alert", variantClass[variant], className)}
      data-testid={dataTestId}
    >
      <div className="inline-alert-title">
        {title}
      </div>
      {message ? <div className="inline-alert-message">{message}</div> : null}
      {actions ? <div className="inline-alert-actions">{actions}</div> : null}
    </div>
  );
}
