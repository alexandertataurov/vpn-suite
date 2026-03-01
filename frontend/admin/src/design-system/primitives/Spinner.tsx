import { cn } from "@vpn-suite/shared";

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <span className={cn("ds-spinner", className)} role="status" aria-label="Loading">
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
    </span>
  );
}

Spinner.displayName = "Spinner";
