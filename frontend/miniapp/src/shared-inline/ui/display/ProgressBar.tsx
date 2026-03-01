import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

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
  const pct = Math.min(max, Math.max(0, value));
  const progressStyle = { "--progress": `${(pct / max) * 100}%` } as CSSProperties;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("progress-bar", className)}
      data-testid={dataTestId}
      style={progressStyle}
      {...props}
    >
      <div className="progress-bar-fill" />
    </div>
  );
}
