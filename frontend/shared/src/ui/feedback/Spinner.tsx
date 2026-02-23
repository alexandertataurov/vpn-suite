import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  size?: "sm" | "md";
  "aria-label"?: string;
  "data-testid"?: string;
}

const sizeClass = { sm: "spinner-sm", md: "spinner-md" } as const;

export function Spinner({
  size = "md",
  className,
  "aria-label": ariaLabel,
  "data-testid": dataTestId,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-busy
      aria-label={ariaLabel ?? "Loading"}
      className={cn("btn-spinner", sizeClass[size], className)}
      data-testid={dataTestId}
      {...props}
    />
  );
}
