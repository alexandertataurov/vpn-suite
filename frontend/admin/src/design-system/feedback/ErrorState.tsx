import type { HTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { Button } from "../primitives/Button";

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  message?: string;
  retry?: () => void;
  "data-testid"?: string;
}

export function ErrorState({
  title,
  message,
  retry,
  className = "",
  "data-testid": dataTestId,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn("error-state", className)}
      role="alert"
      data-testid={dataTestId}
      {...props}
    >
      <div className="error-state-title">{title}</div>
      {message != null && message !== "" ? (
        <div className="error-state-message">{message}</div>
      ) : null}
      {retry != null && (
        <Button variant="secondary" size="sm" onClick={retry} className="error-state-retry">
          Retry
        </Button>
      )}
    </div>
  );
}
