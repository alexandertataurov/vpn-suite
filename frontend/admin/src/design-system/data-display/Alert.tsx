import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type AlertVariant = "nominal" | "warning" | "critical" | "info" | "error";

export interface AlertProps {
  variant: AlertVariant;
  title: string;
  message?: string;
  actions?: ReactNode;
  className?: string;
}

export function Alert(props: AlertProps) {
  const { variant, title, message, actions, className } = props;
  const resolvedVariant = variant === "error" ? "critical" : variant;
  const role = resolvedVariant === "warning" || resolvedVariant === "critical" ? "alert" : "status";
  return (
    <div role={role} aria-live="polite" className={cn("ds-alert", `ds-alert--${resolvedVariant}`, className)}>
      <div className="ds-alert__title">{title}</div>
      {message != null && message !== "" && <div className="ds-alert__message">{message}</div>}
      {actions != null && <div className="ds-alert__actions">{actions}</div>}
    </div>
  );
}

Alert.displayName = "Alert";
