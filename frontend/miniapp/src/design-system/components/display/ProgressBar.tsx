import { useRef, useLayoutEffect } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  max?: number;
  label?: string;
  "data-testid"?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  "data-testid": dataTestId,
  ...props
}: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.min(max, Math.max(0, value));
  const valueStr = `${(pct / max) * 100}%`;
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--progress", valueStr);
  }, [valueStr]);
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("progress-bar", className)}
      data-testid={dataTestId}
      {...props}
    >
      <div className="progress-bar-fill" />
    </div>
  );
}
