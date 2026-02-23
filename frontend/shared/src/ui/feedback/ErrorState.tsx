import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Button } from "../buttons/Button";

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Short error title */
  title: string;
  /** Optional detail message */
  message?: string;
  /** Optional retry callback; when set, shows Retry button */
  retry?: () => void;
  /** Optional for tests */
  "data-testid"?: string;
}

/**
 * Inline error state for tables and panels: icon + title + message + optional Retry.
 * Use for failed fetches or validation errors within a section (not full-page).
 */
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
